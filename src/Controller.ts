import { World } from "./World";
import { Renderer } from "./Renderer";

export class Controller {
    world = new World(800, 900);
    renderer = new Renderer(this.world);

    iteration() {
        this.world.update();
        this.renderer.render();
    }

    run() {
        setInterval(() => this.iteration(), 20);
    }
}
