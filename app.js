// ======================
// STAGE SETUP
// ======================
const stage = new Konva.Stage({
    container: 'container',
    width: document.getElementById('container').clientWidth,
    height: document.getElementById('container').clientHeight,
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

    shape.on('click', () => {

        if (mode !== "select") return;

        selectedShape = shape;

        tr.nodes([shape]);

        layer.batchDraw();

    });

    layer.batchDraw();

    console.log(stage.toJSON()); // DEBUG

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

    // save full project
    const projectData = {

        // canvas data
        stage: stage.toJSON(),

        // uml code
        umlCode: document.getElementById('umlInput').value

    };

    // create file
    const blob = new Blob(
        [JSON.stringify(projectData)],
        {
            type: 'application/json'
        }
    );

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

    reader.onload = async (event) => {

        try {

            // parse saved project
            const project = JSON.parse(event.target.result);

            // parse stage json
            const stageData = JSON.parse(project.stage);

            // restore uml textarea
            document.getElementById('umlInput').value =
                project.umlCode || "";

            // ======================
            // RESTORE UML DIAGRAM
            // ======================

            if (project.umlCode && project.umlCode.trim() !== "") {

                const id = "imported_" + Date.now();

                const result = await mermaid.render(id, project.umlCode);

                const svg = result.svg;

                const svgDataUrl =
                    'data:image/svg+xml;charset=utf-8,' +
                    encodeURIComponent(svg);

                const img = new Image();

                img.onload = function () {

                    const umlShape = new Konva.Image({

                        x: 100,
                        y: 100,

                        image: img,

                        draggable: true,

                        scaleX: 0.8,
                        scaleY: 0.8

                    });

                    // selection restore
                    umlShape.on('click', () => {

                        if (mode !== "select") return;

                        selectedShape = umlShape;

                        tr.nodes([umlShape]);

                        layer.draw();

                    });

                    layer.add(umlShape);

                    layer.draw();

                };

                img.src = svgDataUrl;

            }

            // clear current layer
            layer.destroyChildren();

            // re-add transformer
            layer.add(tr);

            // get saved nodes
            const children = stageData.children[0].children;

            // rebuild shapes
            children.forEach(node => {

                // skip transformer
                if (node.className === "Transformer") return;

                let shape = null;

                // RECT
                if (node.className === "Rect") {

                    shape = new Konva.Rect(node.attrs);

                }

                // CIRCLE
                else if (node.className === "Circle") {

                    shape = new Konva.Circle(node.attrs);

                }

                // TEXT
                else if (node.className === "Text") {

                    shape = new Konva.Text(node.attrs);

                    // restore dblclick edit
                    shape.on('dblclick', () => {

                        const val = prompt("Enter text");

                        if (val) {

                            shape.text(val);

                            layer.draw();

                        }

                    });

                }

                // ARROW
                else if (node.className === "Arrow") {

                    shape = new Konva.Arrow(node.attrs);

                }

                // IMAGE (skip)
                else if (node.className === "Image") {

                    return;

                }

                // invalid shape
                if (!shape) return;

                // restore selection
                shape.on('click', () => {

                    if (mode !== "select") return;

                    selectedShape = shape;

                    tr.nodes([shape]);

                    layer.draw();

                });

                // add shape
                layer.add(shape);

            });

            // reset transformer
            tr.nodes([]);

            selectedShape = null;

            // redraw
            layer.draw();

            alert("Imported Successfully");

        } catch (err) {

            console.error(err);

            alert("Invalid JSON File");

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

// =================
// resize continer
// =================

window.addEventListener("resize", () => {
    const container = document.getElementById("container");

    stage.width(container.clientWidth);
    stage.height(container.clientHeight);

    stage.draw();
});

// ================
// toggle button 
// ================
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("sidebarToggle");

toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hide");
});

// =================
// copy button code
// =================
function copyCode(el) {
    const code = el.closest(".code-item").querySelector("code").innerText;

    navigator.clipboard.writeText(code).then(() => {
        const msg = el.parentElement.querySelector(".copied-msg");

        msg.classList.add("show");

        setTimeout(() => {
            msg.classList.remove("show");
        }, 1200);
    });
}