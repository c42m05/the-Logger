/** @type {Object.<string, any>} */
var script;

//@input string printMode {"widget":"combobox", "values":[{"label":"No Log", "value":"NONE"}, {"label":"Default", "value":"DEFAULT"}, {"label":"Inspect Properties", "value":"PROPS"}, {"label":"Inspect Deep", "value":"DEEP"}]}
//@input bool logToScreen {"hint":"Enable/disable logging output on the screen."}
//@input string[] printGroups {"hint":"Groups used to filter logs by tags."}
//@input bool printStack {"hint":"Include the source of the log in the output."}

//@input Asset.Material transparent
//@input Asset.Font type

/**
 * Sets up the screen-based logging overlay, including:
 * - Camera
 * - Frames
 * - Touch area
 * - Text output
 * - Interaction
 *
 * Notes:
 * - Uses orthographic camera rendering.
 * - Sets up safe frame and touch interactions.
 * - Colors and alignments are pre-configured.
 *
 * Dependencies:
 * - script
 * - global.scene
 * - script.transparent
 * - script.type
 */
let cameraObject;
let text;
let transform;
let touchTransform;
let touch
let interaction;
let update = null;

let transparentMaterial = script.transparent;
if(script.logToScreen) {
    cameraObject = global.scene.createSceneObject("LOG_CAMERA");
    const touchFrameObject = global.scene.createSceneObject("FULL_FRAME");
    const frameObject = global.scene.createSceneObject("SAFE_FRAME");
    const touchObject = global.scene.createSceneObject("TOUCH_AREA");
    const textObject = global.scene.createSceneObject("LOG_SCREEN");
    const camera = cameraObject.createComponent("Component.Camera");
    const frame = frameObject.createComponent("Component.ScreenRegionComponent");
    const touchFrame = touchFrameObject.createComponent("Component.ScreenRegionComponent");
    touchFrameObject.createComponent("Component.ScreenTransform");
    frameObject.createComponent("Component.ScreenTransform");
    
    transform = textObject.createComponent( "Component.ScreenTransform");
    touchTransform = touchObject.createComponent( "Component.ScreenTransform");
    touch = touchObject.createComponent("Component.Image");
    interaction = touchObject.createComponent("Component.InteractionComponent");
    text = textObject.createComponent("Component.Text");
    
    const scriptObject = script.getSceneObject();
    const layer = LayerSet.makeUnique();

    touchFrame.region = ScreenRegionType.FullFrame;
    frame.region = ScreenRegionType.SafeRender;

    cameraObject.setParent(scriptObject);
    cameraObject.layer = layer;
    cameraObject.enabled = false;

    frameObject.setParent(cameraObject);
    frameObject.layer = layer;

    touchFrameObject.setParent(cameraObject);
    touchFrameObject.layer = layer;
 
    touchObject.setParent(touchFrameObject);
    touchObject.layer = layer;
    
    textObject.setParent(frameObject);
    textObject.layer = layer;
    
    camera.type = Camera.Type.Orthographic;
    camera.renderLayer = layer;
    camera.renderTarget = global.scene.liveTarget;
    camera.renderOrder = 200;

    touch.stretchMode = StretchMode.Stretch;
    touch.mainMaterial = transparentMaterial;
    transparentMaterial.mainPass.baseColor = new vec4(0.0, 0.0, 0.0, 0.9);

    text.textFill.color = new vec4(0.07, 0.58, 0.07, 1.0);
    text.size = 20;
    text.font = script.type;
    text.horizontalOverflow = HorizontalOverflow.Wrap;
    text.horizontalAlignment = HorizontalAlignment.Left;
    text.verticalAlignment = VerticalAlignment.Bottom;

    update = script.createEvent("UpdateEvent");
}

/** 
 * INIT
 * - Load modules and print modes.
 * - Configure settings.
 * - Override global `print` to route logs through `theLogger`.
 */
const Module = require("Logger.js"); // Depends on the file structure
const PrintModes = Module.PrintModes;
const Settings = new Module.Settings();
    Settings.originalPrint = print;
    Settings.groupFilters = script.printGroups;
    Settings.showStack = script.printStack;
    Settings.stack = new Error().stack;;
    Settings.logToScreen = script.logToScreen;
    Settings.printMode = PrintModes[script.printMode];

const Logger = new Module.Logger(Settings);

Object.defineProperty(global, 'print', {
    get: function() {
        return function() {
            return theLogger.apply(this, arguments);
        };
    }
});

/**
 * @typedef {Object} LogArguments
 * @property {string} [printNote] - Optional note to include in the log.
 * @property {string[]} [printGroups] - Optional group identifiers.
 * @property {string} [objectProperties] - Optional object properties to include.
 */

/**
 * Logs information with optional metadata.
 *
 * @param {*} printLog - The main item to be logged.
 * @param {LogArguments} [args={}] - Additional optional metadata for the log.
 */

function theLogger(
    printLog,
    {
        printNote = "",
        printGroups = [],
        objectProperties,
    } = {}
) {
    const log = new Module.Log();
    log.log = printLog;
    log.callstack = new Error().stack;
    log.note = printNote;
    log.groupIds = printGroups;
    log.properties = objectProperties;

    Logger.log(log);
    if(script.logToScreen && Logger.logs.length > 0) logToScreen(Logger.logs, transform, text, interaction);
};

/**
 * Displays logs on-screen with touch interaction for toggling visibility and scrolling.
 *
 * @param {string[]} logs - The array of logs to display.
 * @param {ScreenTransform} transform - The transform component controlling the log panel position.
 * @param {Text} text - The text component displaying the logs.
 * @param {InteractionComponent} interaction - The interaction component for touch handling.
 */
function logToScreen(
    logs,
    transform,
    text,
    interaction
) {
    cameraObject.enabled = true;

    let v = vec2.zero();
    let start = vec2.zero();
    let touch = vec2.zero();
    let visible = true;
    let velocity = vec2.zero();
    let isTouching = false;
    let previousY = 0;

    text.text = "";
    logs = logs.slice(-500);
    if (visible) text.text += "\n>>>\t" + logs.join("\n>>>\t");

    transform.anchors.setCenter(v);
    interaction.isFilteredByDepth = false;

    interaction.onTap.add(() => {
        if (!visible) {
            visible = true;
            v.x = 0;
            transform.anchors.setCenter(v);
            text.enabled = true;
            touchTransform.anchors.setCenter(new vec2(0, 0));
            transparentMaterial.mainPass.baseColor = new vec4(0.0, 0.0, 0.0, 0.9);
        }
    });

    interaction.onTouchStart.add((e) => {
        isTouching = true;
        start = transform.anchors.getCenter();
        touch = e.position;
        previousY = e.position.y;
    });

    interaction.onTouchMove.add((e) => {
        if (!visible) return;

        const dx = e.position.x - touch.x;
        const dy = e.position.y - touch.y;
        const dyFrame = e.position.y - previousY;

        
        if (dx < -0.3 && Math.abs(dx) > Math.abs(dy)) {
            visible = false;
            v = transform.anchors.getCenter();
            v.x = -2;
            transform.anchors.setCenter(v);
            text.enabled = false;
            touchTransform.anchors.setCenter(new vec2(-1.9, 0));
            transparentMaterial.mainPass.baseColor = new vec4(0.0, 0.0, 0.0, 0.6);
            return;
        }
        
        velocity.y = (touch.y - e.position.y) * 2; 
        
        v.y = start.y + velocity.y;
        transform.anchors.setCenter(v);
        if(Math.abs(dyFrame) < 0.05) {
            velocity.y = 0;
        }

        previousY = e.position.y;
    });

    interaction.onTouchEnd.add(() => {
        isTouching = false;
    });

    update.bind(() => {
        if (!visible || isTouching) return;

        v.y += velocity.y;
        velocity.y *= 0.95;

        if (Math.abs(velocity.y) < 0.01) {
            velocity.y = 0;
        }

        transform.anchors.setCenter(v);
    });
};