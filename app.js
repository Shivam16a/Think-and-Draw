// ======================
// STAGE SETUP
// ======================
const stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth - 300,
    height: window.innerHeight - 50,
    draggable: true
});

const layer = new Konva.Layer();
stage.add(layer);

// ======================
// SELECT TOOL SYSTEM
// ======================
let mode = "select";
let selectedShape = null;

// Transformer (resize tool)
const tr = new Konva.Transformer({
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right']
});
layer.add(tr);

// ======================
// SHAPE CREATION
// ======================
function addShape(shape) {
    layer.add(shape);
    layer.draw();

    shape.on('click', () => {
        if (mode !== "select") return;

        selectedShape = shape;
        tr.nodes([shape]);
        layer.draw();
    });
}

// ======================
// RECTANGLE
// ======================
document.getElementById('rectBtn').onclick = () => {
    const rect = new Konva.Rect({
        x: 100,
        y: 100,
        width: 140,
        height: 70,
        fill: '#4caf50',
        draggable: true
    });

    addShape(rect);
};

// ======================
// CIRCLE
// ======================
document.getElementById('circleBtn').onclick = () => {
    const circle = new Konva.Circle({
        x: 200,
        y: 200,
        radius: 40,
        fill: '#ff5722',
        draggable: true
    });

    addShape(circle);
};

// ======================
// TEXT
// ======================
document.getElementById('textBtn').onclick = () => {
    const text = new Konva.Text({
        x: 150,
        y: 150,
        text: "Double Click",
        fontSize: 20,
        fill: "black",
        draggable: true
    });

    text.on('dblclick', () => {
        const val = prompt("Enter text");
        if (val) text.text(val);
        layer.draw();
    });

    addShape(text);
};

// ======================
// ARROW
// ======================
document.getElementById('arrowBtn').onclick = () => {
    const arrow = new Konva.Arrow({
        points: [50, 50, 200, 50],
        stroke: 'black',
        fill: 'black',
        strokeWidth: 3,
        draggable: true
    });

    addShape(arrow);
};

// ======================
// SELECT TOOL
// ======================
document.getElementById('selectBtn').onclick = () => {
    mode = "select";
};

// ======================
// DELETE SHAPE
// ======================
document.getElementById('deleteBtn').onclick = () => {
    if (selectedShape) {
        selectedShape.destroy();
        tr.nodes([]);
        layer.draw();
    }
};

// ======================
// COLOR CHANGE
// ======================
document.getElementById('colorPicker').oninput = (e) => {
    if (selectedShape) {
        selectedShape.fill(e.target.value);
        layer.draw();
    }
};

// ======================
// ZOOM
// ======================
document.getElementById('zoomIn').onclick = () => {
    stage.scaleX(stage.scaleX() + 0.1);
    stage.scaleY(stage.scaleY() + 0.1);
    layer.draw();
};

document.getElementById('zoomOut').onclick = () => {
    stage.scaleX(stage.scaleX() - 0.1);
    stage.scaleY(stage.scaleY() - 0.1);
    layer.draw();
};

// ======================
// DOWNLOAD PNG
// ======================
document.getElementById('downloadPngBtn').onclick = async () => {

    try {

        layer.draw();

        const dataURL = stage.toDataURL({
            pixelRatio: 2
        });

        const blob = await (await fetch(dataURL)).blob();

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'diagram.png';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    } catch (err) {

        console.error(err);
        alert("Export failed (canvas tainted)");

    }
};


// ======================
// EXPORT PROJECT (JSON)
// ======================
document.getElementById('downloadJsonBtn').onclick = () => {

    // convert stage to JSON
    const json = stage.toJSON();

    // create downloadable file
    const blob = new Blob([json], {
        type: 'application/json'
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = 'diagram.json';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};


// ======================
// IMPORT BUTTON
// ======================
document.getElementById('importBtn').onclick = () => {

    document.getElementById('importJson').click();

};


// ======================
// IMPORT JSON PROJECT
// ======================
document.getElementById('importJson').onchange = (e) => {

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {

        const json = event.target.result;

        try {

            // clear old
            layer.destroyChildren();
            layer.add(tr);

            // load nodes into SAME stage
            Konva.Node.create(json, stage);

            stage.draw();

            alert("Imported");

        } catch (err) {
            console.error(err);
            alert("Invalid file");
        }
    };

    reader.readAsText(file);
};


// ======================
// CLEAR CANVAS
// ======================
document.getElementById('clearBtn').onclick = () => {

    const confirmClear = confirm("Clear canvas?");

    if (!confirmClear) return;

    layer.destroyChildren();

    // re-add transformer
    layer.add(tr);

    tr.nodes([]);

    selectedShape = null;

    layer.draw();

};


// ======================
// OPTIONAL:
// KEYBOARD SHORTCUTS
// ======================
window.addEventListener('keydown', (e) => {

    // CTRL + S = Export JSON
    if (e.ctrlKey && e.key === 's') {

        e.preventDefault();

        document.getElementById('downloadJsonBtn').click();
    }

    // DELETE KEY
    if (e.key === 'Delete') {

        if (selectedShape) {

            selectedShape.destroy();

            tr.nodes([]);

            selectedShape = null;

            layer.draw();
        }
    }

});

// ======================
// UML RENDER (ADD TO CANVAS)
// ======================
document.getElementById('renderBtn').onclick = async () => {

    const code = document.getElementById('umlInput').value.trim();

    if (!code) return alert("Enter UML code");

    try {

        const id = "m" + Date.now();

        const result = await mermaid.render(id, code);

        const svg = result.svg;

        // ✅ SAFE: convert SVG to data URI (NOT blob URL)
        const svgDataUrl =
            'data:image/svg+xml;charset=utf-8,' +
            encodeURIComponent(svg);

        const img = new Image();

        img.onload = function () {

            const shape = new Konva.Image({
                x: 100,
                y: 100,
                image: img,
                draggable: true,
                scaleX: 0.8,
                scaleY: 0.8
            });

            addShape(shape);
        };

        img.onerror = () => {
            alert("Failed to load UML image");
        };

        img.src = svgDataUrl;

    } catch (err) {
        console.error(err);
        alert("Invalid UML");
    }
};