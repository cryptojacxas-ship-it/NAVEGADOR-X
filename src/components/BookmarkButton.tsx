import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { addBookmark, deleteBookmark, isUrlBookmarked } from '@/src/lib/bookmarksService';

interface BookmarkButtonProps {
  url: string;
  title?: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  onBookmarkChange?: (isBookmarked: boolean) => void;
}

export function BookmarkButton({ 
  url, 
  title = 'Marcador', 
  category = 'Navegación',
  size = 'md',
  variant = 'icon',
  onBookmarkChange
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfBookmarked();
  }, [url]);

  const checkIfBookmarked = async () => {
    try {
      const bookmarked = await isUrlBookmarked(url);
      setIsBookmarked(bookmarked);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const handleToggleBookmark = async () => {
    setIsLoading(true);
    try {
      if (isBookmarked) {
        // Find and delete the bookmark
        const { getAllBookmarks } = await import('@/src/lib/bookmarksService');
        const bookmarks = await getAllBookmarks();
        const bookmark = bookmarks.find(bm => bm.url === url);
        if (bookmark) {
          await deleteBookmark(bookmark.id);
          setIsBookmarked(false);
          onBookmarkChange?.(false);
        }
      } else {
        // Add new bookmark
        await addBookmark({
          title,
          url,
          category,
          isInternal: url.startsWith('navegador://') || url.startsWith('runtime://')
        });
        setIsBookmarked(true);
        onBookmarkChange?.(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleToggleBookmark}
        disabled={isLoading}
        className={cn(
          sizeClasses[size],
          "rounded-lg transition-all duration-200 hover:bg-white/10",
          isBookmarked
            ? "text-brand-magenta hover:text-brand-magenta/80"
            : "text-gray-400 hover:text-brand-magenta"
        )}
        title={isBookmarked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Star 
          size={iconSizes[size]} 
          fill={isBookmarked ? 'currentColor' : 'none'}
          strokeWidth={isBookmarked ? 0 : 2}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleBookmark}
      disabled={isLoading}
      className={cn(
        "px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all duration-200",
        "flex items-center gap-2",
        isBookmarked
          ? "bg-brand-magenta text-black hover:bg-brand-magenta/90"
          : "bg-white/5 text-gray-400 hover:bg-brand-magenta hover:text-black"
      )}
    >
      <Star 
        size={14} 
        fill={isBookmarked ? 'currentColor' : 'none'}
        strokeWidth={isBookmarked ? 0 : 2}
      />
      {isBookmarked ? 'En Favoritos' : 'Agregar a Favoritos'}
    </button>
  );
}
