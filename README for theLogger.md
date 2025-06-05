# theLogger for Lens Studio
<img src="https://images.ctfassets.net/ub38vssza5h3/7FynBv68WKAHYYAe7XQhlk/dfa0ebd5e13c3bdd5b0f34345e65170f/LS.png" width="100" height="100" alt="Lens Studio">

This extends the print() function in LS with additional features for detailed logging. Supports logging to the console and screen, with customizable formats, groups, and filtering options.

## Features

-   **Multiple Print Modes**:
    -   `No Log`: Suppress all output
    -   `Default`: Standard print output
	-   `Inspect Properties`: Inspect object properties (shallow)
    -   `Inspect Deep`: Recursive object inspection (up to 5 levels deep)
        
-   **Group Filtering**: Filter logs by tags/groups
    
-   **Stack Traces**: Optional inclusion of call stack information
    
-   **Interactive Screen Logging**: Visual logging overlay in Lens Preview
        - Swipe to hide log panel
        - Tap to nudge to show
	    - Scroll through logs
	   
-   **Method Chaining**:
	```js
	print(obstacles, { objectProperties: "position.normalize()" });
	```

## Installation
1. Add theLogger component (.lsc file) to your Lens Studio project
2. Add it to top of your scene hierarchy
3. Configure inputs

## Configuration Options
| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `Print Mode` | Dropdown | NONE/DEFAULT/PROPS/DEEP | DEFAULT |
| `Log To Screen` | Boolean | true/false | false |
| `Print Groups` | String Array | Any tags | [] |
| `Print Stack` | Boolean | true/false | false |

## Usage Examples
```javascript
//Basic log
print("Game started");

//Advanced log
print(gameObject, {
    printNote: "Player position",
    printGroups: ["player", "debug"],
    objectProperties: "transform.getWorldPosition()"
});
```
**With Arguments**
```js
//With print note:
print("Game started", {printNote:"Note"})
print("Game started", {printNote:"~source"})
print("Game started", {printNote:"~groupIds", printGroups:["state", "debug"]})
print("Game started", {printNote:"~properties", objectProperties: "replace('Game', 'Countdown')"})
//Output: 
//	Note - Game Started
//	main.js - Game Started
//	[state, debug] - Game Started
//	replace('Game', 'Countdown') - Countdown Started
```

**Inspect Properties**
```javascript
print(obstacles);
//Output:
//	0 - [object object]
//	1 - [object object]
//	2 - [object object]
//	2 - [object object]

//With method chaining:
print(obstacles, {
  objectProperties: "getTransform().getWorldPosition()" 
});
//Output:
//	0 - vec3()
//	1 - vec3()
//	2 - vec3()
//	3 - vec3()
```
**Inspect Deep:**
```js
print(obstacles);
//Output:
//	0 - {
//		name - Obstacle 0
//		getTransform - function(){}
//		onEnabled - {
//			...
//			add - function(){}
//			...
//		}
//	}
//	1 - {
//		name - Obstacle 1
//		getTransform - function(){}
//		onEnabled - {
//			...
//			add - function(){}
//			...
//		}
//	}
```

## Contributing

Pull requests are welcome! Please open an issue first to discuss proposed changes.

# License

<p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/c42m05/the-Logger">theLogger</a> by <a rel="cc:attributionURL dct:creator" property="cc:attributionName" href="https://c42m05.github.io/">c4205M</a> is licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">CC BY-NC 4.0<img style="height:22px;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img style="height:22px;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img style="height:22px;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/nc.svg?ref=chooser-v1" alt=""></a></p>
