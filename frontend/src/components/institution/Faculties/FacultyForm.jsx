// frontend/src/components/institute/Faculties/FacultyForm.jsx
const FacultyForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departments: ['']
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Call instituteAPI.addFaculty(formData)
    onSuccess();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="text-xl font-bold mb-4">Add New Faculty</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Faculty Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="btn-primary">Save Faculty</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};