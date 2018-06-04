import { World } from "./World";
import { Renderer } from "./Renderer";

export class Controller {
    world = new World(400, 400, { x: 150, y: 150 });
    renderer = new Renderer(this.world);

    iteration() {
        this.world.update();
        this.renderer.render();
    }
}
