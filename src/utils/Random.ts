// https://en.wikipedia.org/wiki/Lehmer_random_number_generator

const MAX_INT32 = 2147483647;
const MINSTD = 16807;

export class Random {
    seed: number;

    constructor(
        seed: number,
    ) {
        if (!Number.isInteger(seed)) {
            throw new TypeError("Expected `seed` to be a `integer`");
        }

        this.seed = seed % MAX_INT32;

        if (this.seed <= 0) {
            this.seed += (MAX_INT32 - 1);
        }
    }

    next() {
        return this.seed = this.seed * MINSTD % MAX_INT32;
    }

    nextFloat() {
        return (this.next() - 1) / (MAX_INT32 - 1);
    }
}
