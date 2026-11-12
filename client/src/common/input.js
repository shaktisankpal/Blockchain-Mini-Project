const Input = ({ label, value, onChange, type, id, required }) => (
    <div className="mt-3">
        <label
            htmlFor={id}
            className="block mb-2 text-sm font-medium text-white "
        >
            {label}
        </label>
        <input
            type={type}
            name={id}
            id={id}
            className="bg-ink-700 border border-white/10 text-white sm:text-sm rounded-lg focus:ring-lime focus:border-lime block w-full p-2.5 "
            placeholder={label}
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

export default Input;