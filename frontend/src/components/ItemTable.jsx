import formatDate from '../utils/formatDate.js';

const ItemTable = ({ items }) => {
  if (!items.length) return <p className="empty-state">No items yet.</p>;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th className="table__num">Quantity</th>
          <th>Location</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.sku}</td>
            <td className="table__num">{item.quantity}</td>
            <td>{item.location ?? '-'}</td>
            <td>{formatDate(item.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ItemTable;
