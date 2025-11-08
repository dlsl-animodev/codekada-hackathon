import * as THREE from "three";

// lightweight singleton to expose the scene graph to other modules
// note: this serializes three.js objects into a compact json snapshot for the ai

type LabeledRefs = Record<string, THREE.Object3D | null>;

type NodeSummary = {
  name: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  materialColor?: string;
  children?: number;
};

type CollisionObject = {
  object: THREE.Object3D;
  radius: number;
};

class WorldRegistry {
  private sceneRoot: THREE.Object3D | null = null;
  private labeled: LabeledRefs = {};
  private collidableObjects: CollisionObject[] = [];

  setSceneRoot(root: THREE.Object3D) {
    this.sceneRoot = root;
  }

  registerObject(label: string, obj: THREE.Object3D | null) {
    if (!obj) return;
    this.labeled[label.toLowerCase()] = obj;
  }

  // register an object as collidable with a collision radius
  registerCollidable(obj: THREE.Object3D, radius: number) {
    if (!obj) return;
    this.collidableObjects.push({ object: obj, radius });
  }

  // check if a position would collide with any collidable objects
  checkCollision(position: THREE.Vector3, playerRadius: number = 0.5): boolean {
    for (const collidable of this.collidableObjects) {
      const objPos = new THREE.Vector3();
      collidable.object.getWorldPosition(objPos);
      
      // simple 2d circle collision (ignore y-axis)
      const dx = position.x - objPos.x;
      const dz = position.z - objPos.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const minDistance = playerRadius + collidable.radius;
      
      if (distance < minDistance) {
        return true; // collision detected
      }
    }
    return false;
  }

  // get a valid position that doesn't collide (push away from collision)
  getValidPosition(targetPosition: THREE.Vector3, currentPosition: THREE.Vector3, playerRadius: number = 0.5): THREE.Vector3 {
    if (!this.checkCollision(targetPosition, playerRadius)) {
      return targetPosition.clone();
    }
    
    // if collision detected, try to slide along the obstacle
    const validPos = currentPosition.clone();
    
    // try moving only in x direction
    const xOnly = new THREE.Vector3(targetPosition.x, targetPosition.y, currentPosition.z);
    if (!this.checkCollision(xOnly, playerRadius)) {
      return xOnly;
    }
    
    // try moving only in z direction
    const zOnly = new THREE.Vector3(currentPosition.x, targetPosition.y, targetPosition.z);
    if (!this.checkCollision(zOnly, playerRadius)) {
      return zOnly;
    }
    
    // can't move, stay in current position
    return validPos;
  }

  getObjectByLabel(label: string): THREE.Object3D | null {
    return this.labeled[label.toLowerCase()] ??
      this.sceneRoot?.getObjectByName(label) ?? null
    ;
  }

  // traverse the scene and produce a compact snapshot for prompts
  getSnapshot(maxNodes = 200): NodeSummary[] {
    const out: NodeSummary[] = [];
    if (!this.sceneRoot) return out;

    let count = 0;
    this.sceneRoot.traverse((o: any) => {
      if (count >= maxNodes) return;
      const name: string = o.name || "";
      if (!name) return; // only include named nodes to keep output compact

      const pos = new THREE.Vector3();
      const rot = new THREE.Euler();
      const scl = new THREE.Vector3();
      o.updateWorldMatrix?.(true, false);
      const m = o.matrixWorld ?? o.matrix;
      if (m && m.decompose) {
        m.decompose(pos, new THREE.Quaternion(), scl);
      }
      // rotation extraction (approx): use object's world rotation if available
      rot.copy(o.getWorldQuaternion ? new THREE.Euler().setFromQuaternion(o.getWorldQuaternion(new THREE.Quaternion())) : o.rotation || new THREE.Euler());

      let colorHex: string | undefined;
      if (o.isMesh && o.material) {
        const materials = Array.isArray(o.material) ? o.material : [o.material];
        const matWithColor = materials.find((m: any) => m && m.color);
        if (matWithColor && matWithColor.color) {
          colorHex = "#" + matWithColor.color.getHexString();
        }
      }

      out.push({
        name,
        type: o.type || o.constructor?.name || "Object3D",
        position: [Number(pos.x.toFixed(3)), Number(pos.y.toFixed(3)), Number(pos.z.toFixed(3))],
        rotation: [Number(rot.x.toFixed(3)), Number(rot.y.toFixed(3)), Number(rot.z.toFixed(3))],
        scale: [Number(scl.x.toFixed(3)), Number(scl.y.toFixed(3)), Number(scl.z.toFixed(3))],
        materialColor: colorHex,
        children: o.children?.length ?? 0,
      });
      count++;
    });

    return out;
  }

  // compact string to attach in prompts; keep under a few kb
  getSnapshotText(maxNodes = 120): string {
    const snap = this.getSnapshot(maxNodes);
    try {
      return `[[WORLD_SNAPSHOT_START]]\n${JSON.stringify(snap)}\n[[WORLD_SNAPSHOT_END]]`;
    } catch {
      return "[[WORLD_SNAPSHOT_START]][][[WORLD_SNAPSHOT_END]]";
    }
  }
}

export const World = new WorldRegistry();
