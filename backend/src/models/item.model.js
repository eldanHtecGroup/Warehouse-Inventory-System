export default class Item {
  constructor({ id, name, sku, quantity = 0, location = null, createdAt, updatedAt }) {
    this.id = id;
    this.name = name;
    this.sku = sku;
    this.quantity = quantity;
    this.location = location;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? this.createdAt;
  }
}
