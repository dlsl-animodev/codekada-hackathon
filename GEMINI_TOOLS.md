# gemini live function tools integration

this project integrates the gemini live api with function calling capabilities, allowing the ai to interact directly with the game world through tools instead of manual text parsing.

## architecture changes

**before**: manual text parsing in useEffect hooks to detect commands
**after**: ai-driven function calling through gemini live tools api

### key improvements:
- ✅ removed objectStates state management
- ✅ removed manual player movement detection
- ✅ ai now controls all interactions through function tools
- ✅ direct scene graph queries via World registry
- ✅ real-time object manipulation through three.js

## available tools

### scene query tools (new!)

#### 1. getSceneSnapshot
retrieves complete snapshot of all scene objects.

**parameters:** none

**returns:**
- `objectCount`: number of objects in scene
- `objects`: array of object summaries with positions, rotations, scales, colors

**when ai uses it:**
- understanding current world state
- checking object positions before movement
- analyzing scene composition

#### 2. getObjectInfo
gets detailed information about a specific object.

**parameters:**
- `objectName` (string): object to query (bed, desk, drawer, campfire, player)

**returns:**
- `position`: [x, y, z] coordinates
- `rotation`: [x, y, z] euler angles
- `scale`: [x, y, z] scale values
- `color`: hex color code if available

**when ai uses it:**
- checking object properties before manipulation
- verifying object positions
- getting current state

#### 3. getPlayerPosition
gets player's current position.

**parameters:** none

**returns:**
- `position`: [x, y, z] player coordinates

**when ai uses it:**
- determining player location
- calculating distances to objects
- pathfinding decisions

#### 4. listSceneObjects
lists all named objects in the scene.

**parameters:** none

**returns:**
- `count`: total number of named objects
- `objects`: array with name, type, position for each object

**when ai uses it:**
- discovering available objects
- inventory checking
- scene exploration

### manipulation tools

#### 5. changeObjectColor
changes object color directly in scene graph.

**parameters:**
- `objectName` (string): object to modify
- `color` (string): target color name or hex

**implementation:**
- queries World registry for object reference
- applies color to three.js material
- handles both mesh and group objects

**example:**
- user: "make the bed red"
- ai: calls `changeObjectColor({ objectName: "bed", color: "red" })`

#### 6. rotateObject
rotates object in scene.

**parameters:**
- `objectName` (string): object to rotate
- `action` (string): flip | spin | reset

**implementation:**
- directly modifies three.js object rotation
- immediate visual feedback

#### 7. movePlayer
moves player character to location or object.

**parameters:**
- `target` (string): object name or coordinates "x,y,z"

**implementation:**
- parses coordinates or queries object position via World registry
- calls player.moveTo() with target position

**example:**
- user: "go to the desk"
- ai: calls `getObjectInfo({ objectName: "desk" })` → gets position → calls `movePlayer({ target: "desk" })`

#### 8. inspectObject
provides narrative descriptions of objects.

**parameters:**
- `objectName` (string): object to inspect

**returns:**
- `description`: narrative text about the object

#### 9. unlockClue
reveals clues and puzzle pieces.

**parameters:**
- `clueId` (string): unique identifier
- `clueText` (string): clue content

**when ai uses it:**
- player discovers something important
- puzzle progression
- narrative advancement

### inventory & puzzle tools (new!)

#### 10. pickupObject
picks up an object and adds it to inventory, making it invisible.

**parameters:**
- `objectName` (string): object to pick up (e.g., 'match')

**implementation:**
- queries World registry for object
- sets object.visible = false
- adds to inventory state
- prevents duplicate pickups

**example:**
- user: "pick up the match"
- ai: calls `pickupObject({ objectName: "match" })`
- result: match disappears, added to inventory

#### 11. lightCampfire
lights the campfire using a match from inventory.

**parameters:** none

**implementation:**
- checks if player has match in inventory
- makes CampFire and CampFire_Fire objects visible
- requires match to be picked up first

**example:**
- user: "light the campfire"
- ai: calls `checkInventory()` → verifies match → calls `lightCampfire()`
- result: campfire becomes visible and lit

#### 12. checkInventory
checks what items the player is carrying.

**parameters:** none

**returns:**
- `inventory`: array of item names
- `itemCount`: number of items
- `message`: formatted inventory list

**when ai uses it:**
- player asks what they have
- before using items
- puzzle solving decisions

## game mechanics

### inventory system

**items:**
- match_object - can be picked up to light campfire

**state management:**
```typescript
const [inventory, setInventory] = useState<string[]>([]);
```

**ui display:**
- inventory shown in top-right corner when not empty
- items listed with bullet points
- styled with detective theme

### campfire puzzle

**initial state:**
- CampFire: visible = false
- CampFire_Fire: visible = false
- match_object: visible = true

**solution flow:**
1. player finds and picks up match
   - ai: `pickupObject({ objectName: "match" })`
   - match becomes invisible, added to inventory
2. player goes to campfire location
   - ai: `movePlayer({ target: "campfire" })`
3. player lights campfire with match
   - ai: `lightCampfire()`
   - campfire and fire become visible

**error handling:**
- trying to light without match: "you need a match to light the campfire"
- picking up same item twice: "you already have the match"

## how it works now

### data flow

```
user speaks/types
    ↓
gemini live processes input
    ↓
ai decides to use tool
    ↓
tool call received in handleMessage()
    ↓
registered callback executes
    ↓
World.getObjectByLabel() retrieves three.js object
    ↓
direct manipulation of scene graph
    ↓
result sent back to ai
    ↓
ai responds with context-aware message
```

### example interaction flow

**user**: "where am i? what objects are nearby?"

**ai thinking**:
1. call `getPlayerPosition()` → {position: [0, 0, 0]}
2. call `listSceneObjects()` → {objects: [bed, desk, drawer, campfire]}
3. call `getObjectInfo({ objectName: "bed" })` → {position: [2, 0, 2]}
4. calculate distance from player to bed

**ai response**: "you're at the center of the room. nearby, i can see a bed to your northeast, a desk to your northwest, a drawer to your southeast, and a mystical campfire right in front of you."

**user**: "move to the desk and change it to gold"

**ai thinking**:
1. call `movePlayer({ target: "desk" })`
2. call `changeObjectColor({ objectName: "desk", color: "gold" })`

**ai response**: "i've moved you to the desk and changed its color to gold. the wood now gleams with an otherworldly golden sheen."

## removed implementations

### what was removed:

1. **objectStates state** - no longer needed
   ```typescript
   // removed
   const [objectStates, setObjectStates] = useState<{...}>({...});
   ```

2. **manual text parsing** - replaced with ai tool decisions
   ```typescript
   // removed
   useEffect(() => {
     if (text.includes("flip")) { /* ... */ }
     if (text.includes("spin")) { /* ... */ }
   }, [messages]);
   ```

3. **manual player movement detection** - ai now calls movePlayer tool
   ```typescript
   // removed
   useEffect(() => {
     if (text.includes("move to")) { /* ... */ }
   }, [messages]);
   ```

### what remains:

- World registry for scene graph access
- player ref for movement control
- three.js scene manipulation
- tool registration system

## adding new tools

### step 1: define tool in config

add to the `tools` array in `useGeminiLive.ts`:

```typescript
{
  name: "yourToolName",
  description: "what your tool does",
  parameters: {
    type: Type.OBJECT,
    properties: {
      paramName: {
        type: Type.STRING,
        description: "parameter description"
      }
    },
    required: ["paramName"]
  }
}
```

### step 2: register callback

in your component (e.g., `page.tsx`):

```typescript
useEffect(() => {
  if (!isConnected) return;

  registerTool("yourToolName", ({ paramName }) => {
    // your logic here
    return { success: true, result: "..." };
  });

  return () => unregisterTool("yourToolName");
}, [isConnected]);
```

### step 3: test

try prompts that would logically trigger your tool:
- "use [tool functionality]"
- ask the ai to perform the action

## best practices

1. **clear descriptions**: make tool descriptions specific so ai knows when to use them
2. **validation**: validate parameters in callbacks and return error messages
3. **feedback**: return meaningful responses that ai can use in conversation
4. **cleanup**: always unregister tools in useEffect cleanup
5. **type safety**: use typescript interfaces for tool parameters

## debugging

enable console logging to see tool execution:
- tool calls received: `console.log("received tool call:", ...)`
- tool execution: `console.log("executing tool:", functionName, args)`
- tool results: `console.log("tool result:", result)`

## limitations

- tools must be registered before ai can call them
- tool responses should be JSON-serializable
- complex operations should be broken into multiple tools
- ai decides when to use tools - you can't force it

## example conversation flow

**user**: "investigate the desk and make it blue"

**ai thinking**:
1. user wants to inspect desk → call `inspectObject({ objectName: "desk" })`
2. user wants color change → call `changeObjectColor({ objectName: "desk", color: "blue" })`

**ai response**: "i've examined the desk - it's a mahogany writing desk with papers scattered across it. i've also changed its color to blue. would you like me to help you search through the papers?"

## troubleshooting

### tool not being called
- check tool description clarity
- ensure parameters match schema
- verify tool is registered before ai receives context
- check console for errors

### callback not executing
- confirm tool name matches exactly
- verify registerTool was called
- check that callback returns a value
- ensure no errors in callback logic

### type errors
- use `Type.OBJECT`, `Type.STRING`, etc. from @google/genai
- add `as any` to config if needed for complex schemas
- validate parameter types in callback
