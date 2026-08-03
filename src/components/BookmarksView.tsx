import { useState, useEffect } from 'react';
import { Star, Trash2, Plus, Search, ExternalLink, Folder, X, Edit2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { 
  Bookmark, 
  getAllBookmarks, 
  deleteBookmark, 
  getBookmarkCategories, 
  getBookmarksByCategory,
  updateBookmark 
} from '@/src/lib/bookmarksService';

interface BookmarksViewProps {
  onNavigate?: (url: string) => void;
  currentUrl?: string;
}

export function BookmarksView({ onNavigate, currentUrl }: BookmarksViewProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    setIsLoading(true);
    try {
      const allBookmarks = await getAllBookmarks();
      setBookmarks(allBookmarks);

      const cats = await getBookmarkCategories();
      const uniqueCategories = cats.map(c => c.name);
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error loading bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      await deleteBookmark(id);
      setBookmarks(bookmarks.filter(bm => bm.id !== id));
    } catch (err) {
      console.error('Error deleting bookmark:', err);
    }
  };

  const handleUpdateTitle = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await updateBookmark(id, { title: editTitle });
      setBookmarks(bookmarks.map(bm => 
        bm.id === id ? { ...bm, title: editTitle } : bm
      ));
      setEditingId(null);
      setEditTitle('');
    } catch (err) {
      console.error('Error updating bookmark:', err);
    }
  };

  const filteredBookmarks = bookmarks.filter(bm => {
    const matchesSearch = bm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bm.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || bm.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const startEditing = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditTitle(bookmark.title);
  };

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-subtle pb-6">
        <div className="space-y-1">
          <h2 className="text-sm font-bold tracking-[0.3em] text-gray-500 uppercase">Gestión de Favoritos</h2>
          <p className="text-3xl font-light text-white">Mis Marcadores <span className="text-brand-cyan">Guardados</span></p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono tracking-tighter text-gray-600">Total de Marcadores</div>
            <div className="text-xl font-bold font-mono text-brand-magenta">{bookmarks.length}</div>
          </div>
          <div className="p-3 rounded-full bg-brand-magenta/10 border border-brand-magenta/20 text-brand-magenta">
            <Star size={20} />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600" size={18} />
        <input
          type="text"
          placeholder="Buscar marcadores por título o URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan/50 transition-colors"
        />
      </div>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              !selectedCategory
                ? "bg-brand-cyan text-black"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            Todos ({bookmarks.length})
          </button>
          {categories.map((category) => {
            const count = bookmarks.filter(bm => bm.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                  selectedCategory === category
                    ? "bg-brand-magenta text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                )}
              >
                <Folder size={14} />
                {category} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Bookmarks Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500 text-sm">Cargando marcadores...</div>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Star size={48} className="text-gray-600" />
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No se encontraron marcadores que coincidan con tu búsqueda.' : 'Aún no tienes marcadores guardados.'}
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Usa el botón de estrella en la barra de direcciones para guardar tus sitios favoritos.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredBookmarks.map((bookmark, i) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
                className="card group flex flex-col p-6 hover:border-brand-cyan/30 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-[#141418] border border-white/5 group-hover:border-brand-magenta/30 transition-all">
                    <Star size={18} className="text-brand-magenta" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(bookmark)}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-brand-cyan transition-colors"
                      title="Editar título"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Eliminar marcador"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Title Edit Mode */}
                {editingId === bookmark.id ? (
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white/10 border border-brand-cyan/30 rounded text-xs text-white placeholder-gray-600 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateTitle(bookmark.id)}
                      className="p-1.5 rounded bg-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/30 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded bg-white/10 text-gray-400 hover:bg-white/20 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Title */}
                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-tight line-clamp-2 hover:line-clamp-none">
                      {bookmark.title}
                    </h3>

                    {/* Category Badge */}
                    {bookmark.category && (
                      <span className="inline-block text-[9px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded mb-3 w-fit">
                        {bookmark.category}
                      </span>
                    )}
                  </>
                )}

                {/* URL */}
                <p className="text-xs text-gray-600 font-mono mb-4 truncate hover:text-gray-500 cursor-help" title={bookmark.url}>
                  {bookmark.url.replace(/^https?:\/\//, '').substring(0, 40)}...
                </p>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] text-gray-700 font-mono">
                    {new Date(bookmark.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => onNavigate?.(bookmark.url)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:bg-brand-cyan hover:text-black transition-all flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Ir
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Stats Footer */}
      {bookmarks.length > 0 && (
        <div className="p-6 rounded-2xl bg-brand-magenta/5 border border-brand-magenta/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-brand-magenta uppercase tracking-widest">Estadísticas de Marcadores</p>
            <p className="text-sm text-gray-500 font-mono">
              {bookmarks.length} marcador{bookmarks.length !== 1 ? 'es' : ''} guardado{bookmarks.length !== 1 ? 's' : ''} • 
              {categories.length > 0 && ` ${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="text-xs text-gray-600 font-mono">
            Último guardado: {new Date(bookmarks[0]?.createdAt || Date.now()).toLocaleDateString('es-ES')}
          </div>
        </div>
      )}
    </div>
  );
}
