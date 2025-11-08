# refactoring summary: ai-driven scene interaction

## overview
migrated from manual text parsing to ai-driven function calling using gemini live tools api.

## changes made

### 1. removed manual state management

**before:**
```typescript
const [objectStates, setObjectStates] = useState<{
  bed: ObjectState;
  desk: ObjectState;
  drawer: ObjectState;
  campfire: ObjectState;
}>({...});
```

**after:**
- direct three.js scene graph manipulation via World registry
- no intermediate state needed
- ai queries and modifies objects directly

### 2. removed text parsing logic

**before:**
```typescript
useEffect(() => {
  const text = lastMessage.text.toLowerCase();

  if (text.includes("flip")) {
    setObjectStates(prev => {...});
  }

  if (text.includes("move to desk")) {
    playerRef.current.moveTo([...]);
  }
}, [messages]);
```

**after:**
- ai decides when to use tools based on context
- tools registered via `registerTool()`
- cleaner separation of concerns

### 3. added scene query tools

**new capabilities:**
- `getSceneSnapshot()` - complete scene state
- `getObjectInfo(objectName)` - specific object details
- `getPlayerPosition()` - player location
- `listSceneObjects()` - available objects

**benefits:**
- ai can explore scene programmatically
- context-aware responses based on actual positions
- no hardcoded object locations

### 4. refactored component props

**before:**
```typescript
<SceneCanvas
  objectStates={objectStates}
  setObjectStates={setObjectStates}
  playerRef={playerRef}
/>
```

**after:**
```typescript
<SceneCanvas playerRef={playerRef} />
```

**removed from:**
- `page.tsx` - objectStates state
- `scene-canvas.tsx` - objectStates props
- `bedroom-scene.tsx` - objectStates props

### 5. enhanced tool implementations

**movePlayer tool:**
- before: hardcoded positions for objects
- after: queries World registry for actual object positions
- supports both object names and coordinates

**changeObjectColor tool:**
- before: updated state that triggered re-renders
- after: directly modifies three.js material colors
- handles both mesh and group objects

**rotateObject tool:**
- before: set target rotation in state
- after: directly modifies object.rotation
- immediate visual feedback

## tool definitions added to gemini config

```typescript
tools: [
  {
    functionDeclarations: [
      { name: "getSceneSnapshot", ... },
      { name: "getObjectInfo", ... },
      { name: "getPlayerPosition", ... },
      { name: "listSceneObjects", ... },
      { name: "changeObjectColor", ... },
      { name: "rotateObject", ... },
      { name: "movePlayer", ... },
      { name: "inspectObject", ... },
      { name: "unlockClue", ... },
    ]
  }
]
```

## benefits

### for ai:
- can explore scene before making decisions
- context-aware interactions
- more natural conversation flow
- can verify actions after execution

### for code:
- cleaner architecture
- less state management
- direct scene manipulation
- easier to add new tools

### for users:
- more intelligent ai responses
- ai understands spatial relationships
- more immersive experience
- ai can guide player effectively

## example interactions

### simple color change
**user:** "make the bed blue"
**ai flow:**
1. calls `changeObjectColor({ objectName: "bed", color: "blue" })`
2. responds: "i've changed the bed to blue."

### complex spatial query
**user:** "what's the closest object to me?"
**ai flow:**
1. calls `getPlayerPosition()` → {position: [0, 0, 0]}
2. calls `listSceneObjects()` → gets all objects
3. calculates distances
4. responds: "the campfire is closest to you, right in front at your position."

### multi-step action
**user:** "investigate the desk"
**ai flow:**
1. calls `movePlayer({ target: "desk" })`
2. calls `inspectObject({ objectName: "desk" })`
3. calls `getObjectInfo({ objectName: "desk" })` for position context
4. responds with detailed investigation narrative

## migration guide

if you need to add similar functionality to other objects:

1. register object in World registry:
   ```typescript
   World.registerObject("objectName", threeJsObject);
   ```

2. add tool definition in `useGeminiLive.ts`:
   ```typescript
   {
     name: "yourTool",
     description: "...",
     parameters: { ... }
   }
   ```

3. register callback in `page.tsx`:
   ```typescript
   registerTool("yourTool", ({ params }) => {
     const obj = World.getObjectByLabel("objectName");
     // manipulate obj directly
     return { success: true };
   });
   ```

4. remember to unregister in cleanup:
   ```typescript
   return () => unregisterTool("yourTool");
   ```

## testing recommendations

1. test ai can query scene state
2. verify object manipulation works
3. check player movement to objects
4. test coordinate-based movement
5. validate error handling for missing objects
6. confirm tool responses are informative

## future enhancements

potential additions:
- `getObjectsInRadius(position, radius)` - proximity queries
- `findPath(from, to)` - pathfinding
- `pickupObject(objectName)` - inventory system
- `combineObjects(obj1, obj2)` - crafting
- `solveRiddle(riddleId, answer)` - puzzle mechanics
- `setObjectProperty(objectName, property, value)` - generic setter
