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
// SAVE / LOAD
// ======================
document.getElementById('saveBtn').onclick = () => {
    localStorage.setItem("diagram", stage.toJSON());
    alert("Saved");
};

document.getElementById('loadBtn').onclick = () => {
    const data = localStorage.getItem("diagram");
    if (!data) return alert("No data");

    const newStage = Konva.Node.create(data, 'container');
    newStage.draw();
};

// ======================
// CLEAR
// ======================
document.getElementById('clearBtn').onclick = () => {
    layer.destroyChildren();
    layer.add(tr);
    layer.draw();
};

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

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

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

            URL.revokeObjectURL(url);
        };

        img.src = url;

    } catch (err) {
        alert("Invalid UML");
        console.log(err);
    }

};