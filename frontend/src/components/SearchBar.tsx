import { Search } from "lucide-react";
import { useState } from "react";

const SearchBar = ({ onSearch }: { onSearch?: (query: string) => void }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form className="flex items-center bg-light-black/70 rounded-full px-4 py-2 shadow-inner w-72 max-w-full" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Search..."
        className="bg-transparent outline-none text-white flex-1 placeholder-zinc-400"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit" className="ml-2 text-zinc-400 hover:text-white searchbar-icon">
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
};

export default SearchBar; 