/**
 *  A class of Logger's logs and arguments
 */
class Log {
    constructor() {
        /** @type {Object.<string, any>} */
        this.log = {};

        /** @type {string} */
        this.callstack = "";

        /** @type {string} */
        this.note = "";

        /** @type {string[]} */
        this.groupIds = [];

        /** @type {string} */
        this.properties = "";
    }
}

/**
 * Represents the configurable settings for the Logger.
 */
class Settings {
    constructor() {
        /** @type {number} */
        this.printMode = 1;

        /** @type {string[]} */
        this.groupFilters = [];

        /** @type {string} */
        this.discard = "";

        /** 
         * new Error() to parse the callstack -must decleared in the script Logger created
         * 
         * @type {string} 
         * */
        this.stack = "";

        /** @type {boolean} */
        this.showErrors = false;

        /** @type {boolean} */
        this.showStack = false;

        /** @type {boolean} */
        this.logToScreen = false;

        /** @type {function(any): void} */
        this.originalPrint = function(){};
    }
}

/**
 * Available printing modes for the Logger.
 *
 * @readonly
 * @enum {number}
 *
 * @property {number} NONE     – Suppress all output.
 * @property {number} DEFAULT  – Use the value’s built-in `print()` output.
 * @property {number} PROPS    – Log only the value’s own enumerable properties (shallow inspection).
 * @property {number} DEEP     – Recursively log the value and all nested properties (deep inspection).
 */
const PrintModes = {
    NONE:    0,
    DEFAULT: 1,
    PROPS:   2,
    DEEP:    3,
};

/**
 * A Logger class for structured and filtered logging with support for groups, stack traces, and recursive inspection.
 */
class Logger {
    /**
     * @param {Settings} settings
     */
    constructor(settings) {
        this.settings = settings;

        if (this.settings.groupFilters.length === 0) {
            this.settings.groupFilters = ["_any"];
        } else {
            this._print("🗿 FILTERED BY GROUPS!", true);
        }

        /**
         * @type {string[]}
         */
        this.logs = [];

        /**
         * @type {string | null}
         */
        this.sourceFile = this._extractSourceName(settings.stack, true);
    }

    /**
     * Log a message if it passes filters and print mode is enabled.
     * @param {Log} log - The log object containing message and metadata.
     */
    log(log) {
        if (this.settings.printMode === PrintModes.NONE) return;

        log.groupIds.push("_any");
        const idCheck = log.groupIds.some((x) =>
            this.settings.groupFilters.includes(x)
        );

        if (!idCheck) return;

        // Matches a period (.) character:
        //  **not inside parentheses**
        //  **not inside single quotes**
        //  **not inside double quotes**
        const propertyRegex =
            /\.(?=(?:[^()]*\([^()]*\))*[^()]*$)(?![^\']*\'(?:[^()]*\([^()]*\))*[^()]*$)(?![^\"]*\"(?:[^()]*\([^()]*\))*[^()]*$)/;
        const methods = log.properties
            ? log.properties.split(propertyRegex)
            : null;
        const methodConstructions = methods
            ? methods.map((x) => this._parseStringOfFunction(x))
            : null;

        const stackFormatted = this.settings.showStack
            ? " ➜\n" + this._filterStack(log.callstack)
            : "";

        log.note = log.note.replace( "~source", this._extractSourceName(log.callstack));
        log.note = log.note.replace("~groupIds", `[${log.groupIds}]`);
        log.note = log.note.replace("~properties", `[${methods}]`);
        const noteFormatted = log.note.length > 0 ? log.note + " - " : "";

        switch (this.settings.printMode) {
            case PrintModes.DEFAULT:
                const property = this._callProperties(
                    log.log,
                    methodConstructions
                );
                const formatted = `${noteFormatted}${property}${stackFormatted}`;
                this._print(formatted);
                break;
            case PrintModes.PROPS:
                if (this.settings.showStack) this._print(stackFormatted, true);

                for (const i in log.log) {
                    const property = this._callProperties(
                        log.log[i],
                        methodConstructions
                    );
                    const formatted = `${noteFormatted}${i} - ${property}`;
                    this._print(formatted);
                }
                break;
            case PrintModes.DEEP:
                if (this.settings.showStack) this._print(stackFormatted, true);

                this._inspectRecursive(log.log, 0, new Set());
                break;
        }
    }

    /**
     * Recursively inspects an object and prints its structure.
     * @param {*} item - The object to inspect.
     * @param {number} [depth=0] - The current recursion depth.
     * @param {Set<*>} [visited=new Set()] - A set to track circular references.
     * @param {string} [indent="  "] - The indentation string.
     * @private
     */
    _inspectRecursive(item, depth = 0, visited = new Set(), indent = "  ") {
        if (visited.has(item)) {
            this._print(indent.repeat(depth) + `Circular reference detected`);
            return;
        }
        visited.add(item);

        for (const i in item) {
            try {
                if ( typeof item[i] !== "object" || item[i] === null || depth > 4) {
                    this._print(indent.repeat(depth) + `${i} - ${item[i]}`);
                    continue;
                }

                this._print(indent.repeat(depth) + `${i} - {`);
                this._inspectRecursive(
                    item[i],
                    depth + 1,
                    visited,
                );
                this._print(indent.repeat(depth) + "}");
            } catch (err) {
                    this._print(indent.repeat(depth) + `$${i} - ERROR: ${err}`);
            }
        }
    }
    
    /**
     * Calls a series of properties or methods on a log item.
     * @param {*} logItem - The item to operate on.
     * @param {Array<{method: string, arguments: Array<*>, isFunction: boolean}> | null} methodConstructions - An array of parsed methods/properties.
     * @returns {*} - The final result after applying all methods/properties.
     * @private
     */
    _callProperties(logItem = null, methodConstructions = null) {
        if (!methodConstructions) return logItem;

        let errorPin = "";
        try {
            for (const c of methodConstructions) {
                errorPin = c.method;

                if (c.isFunction) {
                    logItem = logItem[c.method](...c.arguments);
                } else {
                    logItem = logItem[c.method];
                }
            }

            return logItem;
        } catch (error) {
            return `${error}${errorPin !== "" ? " on " : ""}${errorPin}`;
        }
    }

    /**
     * Parses a string representing a function call or property access.
     * @param {string} [input=""] - The string to parse.
     * @returns {{method: string, arguments: Array<*>, isFunction: boolean}} - The parsed representation.
     * @private
     */
    _parseStringOfFunction(input = "") {
        const regex = /^(\w+)\s*\(/; // String followed by paranthesis or space
        const methodMatch = input.match(regex);

        if (!methodMatch)
            return { method: input, arguments: [], isFunction: false };

        const method = methodMatch[1];
        let methodArgs = input.slice(methodMatch[0].length, -1).trim();

        if (methodArgs === "")
            return { method, arguments: [], isFunction: true };

        methodArgs = "[" + methodArgs.replace(/'/g, '"') + "]";

        let args;
        try {
            args = JSON.parse(methodArgs);
        } catch (e) {
            throw new Error("Failed to parse arguments");
        }

        return { method, arguments: args, isFunction: true };
    }

    /**
     * Filters the call stack, removing lines matching the source file.
     * @param {string} [stack=""] - The stack trace string.
     * @param {string} [separator="\n"] - The line separator.
     * @returns {string} - The filtered stack trace.
     * @private
     */
    _filterStack(stack = "", separator = "\n") {
        const lines = stack.split("\n").filter(Boolean);
        const filteredLines = [];

        for (const line of lines) {
            if (
                line.includes(this.sourceFile) ||
                line.includes("at apply (native)")
            )
                continue;
            filteredLines.push(line);
        }

        return filteredLines.join(separator);
    }

    /**
     * Extracts the source file name from the stack trace.
     * @param {string} [stack=""] - The stack trace string.
     * @param {boolean} [initial=false] - Whether to skip the initial file match.
     * @returns {string|null} - The extracted file name or null if not found.
     * @private
     */
    _extractSourceName(stack = "", initial = false) {
        const validExtensions = [".js", ".ts"]; // WARNING: hard coded
        const lines = stack.split("\n").filter(Boolean);
        let latestScript = null;

        for (const line of lines) {
            if (!initial && line.includes(this.sourceFile)) continue;

            const match = line.match(/\((.*?)\)/); // Inside of the paranthesis
            if (!match || !match[1]) continue;

            const path = match[1].split(":")[0];
            if (validExtensions.some((x) => path.toLowerCase().includes(x))) {
                latestScript = path;
                break;
            }
        }

        return latestScript;
    }

    /**
     * Prints the log using the provided print function and stores it.
     * @param {string} [log=""] - The log to print.
     * @param {boolean} [defaultPrint=false] - Whether this is a default print (not stored).
     * @private
     */
    _print(log = "", defaultPrint = false) {
        this.settings.originalPrint(log);
        if (defaultPrint) return;
        this.logs.push(log);
    }
}

module.exports.Log = Log;
module.exports.Settings = Settings;
module.exports.PrintModes = PrintModes;
module.exports.Logger = Logger;
