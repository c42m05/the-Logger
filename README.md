# Logger - Logging Module

<div align="center">

<img src="https://images.ctfassets.net/ub38vssza5h3/7FynBv68WKAHYYAe7XQhlk/dfa0ebd5e13c3bdd5b0f34345e65170f/LS.png" width="100" height="100" alt="Lens Studio">

<img src="https://img.shields.io/badge/Lens%20Studio-Module-blue" alt="Lens Studio Module">

<p>The engine behind theLogger for Lens Studio</p>

</div>

## Features

- Structured logging with metadata
- Group-based filtering
- Configurable print modes:
  - NONE: Suppress all output
  - DEFAULT: Use the built-in `print()` output
  - PROPS: Shallow property inspection
  - DEEP: Deep recursive property inspection
- Stack trace support
- Easy integration into your projects

## 📦 Core Components

### `Log` Class
```js
class Log {
  log: any                // Content to log
  callstack: string       // Stack trace
  note: string            // Descriptive message
  groupIds: string[]      // Filter categories
  properties: string      // Property/method chain
}
```

### `Settings` Class
```js
class Settings {
  printMode: number       // Logging mode (0-3)
  groupFilters: string[]  // Active filter groups
  showStack: boolean      // Stack trace visibility
  logToScreen: boolean    // UI output toggle
}
```
### `PrintModes` Enum
| Value | Constant | Description            |
|-------|----------|------------------------|
| 0     | `NONE`   | No output              |
| 1     | `DEFAULT`| Standard logging       |
| 2     | `PROPS`  | Property inspection    |
| 3     | `DEEP`   | Recursive inspection   |

## 🛠️ Usage

### Installation

Simply include `Logger.js` in your project:

```javascript
import Logger from './Logger.js'; 
//or
const Logger = require("./Logger");
```

### Basic Example

```javascript
const settings = new Logger.Settings();
settings.printMode = PrintModes.DEFAULT;
settings.showStack = true;

const logger = new Logger.Logger(settings);

// Create a structured log entry
const log = new Logger.Log();
log.note = "An example log entry.";
log.groupIds.push("example-group");
log.log = { foo: "bar", count: 42 };

logger.log(log);
```

### Filtering by Group

```javascript
settings.groupFilters = ["example-group"];
logger.print(); // Only logs with the specified group will be printed
```

## Contribution

Pull requests are welcome! Please open an issue first to discuss proposed changes.

# License

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/c42m05/the-Logger">theLogger</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://c42m05.github.io/">c4205M</a> is licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC 4.0<img style="height:22px;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img style="height:22px;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img style="height:22px;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" alt=""></a></p>
