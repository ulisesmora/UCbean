export class Product {
  constructor(
    public readonly id: string,
    public readonly categoryId: string,
    public readonly name: string,
    public readonly price: number,
    public readonly isAvailable: boolean,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    /** A qué parte de la carta pertenece. Nulo cuando no se pidió cargarla. */
    public readonly category: { id: string; name: string } | null = null,
    /** When this product is a recipe: its slug and formula, for the 3D and the bag. */
    public readonly recipe: { slug: string; build: unknown } | null = null,
  ) {}
}
