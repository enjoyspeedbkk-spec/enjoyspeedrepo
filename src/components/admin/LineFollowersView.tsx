"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  ArrowUpDown,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

interface LineFollower {
  id: string;
  line_user_id: string;
  user_id: string | null;
  display_name: string | null;
  picture_url: string | null;
  followed_at: string;
  unfollowed_at: string | null;
  is_following: boolean;
  linked_at: string | null;
  linked_via: string | null;
  created_at: string;
  updated_at: string;
}

export function LineFollowersView({
  followers,
}: {
  followers: LineFollower[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "following" | "unfollowed">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const stats = useMemo(() => {
    const following = followers.filter((f) => f.is_following).length;
    const unfollowed = followers.filter((f) => !f.is_following).length;
    const linked = followers.filter((f) => f.user_id).length;
    return { total: followers.length, following, unfollowed, linked };
  }, [followers]);

  const filtered = useMemo(() => {
    let result = [...followers];

    // Filter
    if (filter === "following") result = result.filter((f) => f.is_following);
    if (filter === "unfollowed") result = result.filter((f) => !f.is_following);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.display_name?.toLowerCase().includes(q) ||
          f.line_user_id.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const dateA = new Date(a.followed_at).getTime();
      const dateB = new Date(b.followed_at).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [followers, filter, search, sortBy]);


  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <MessageCircle className="h-6 w-6 text-[#06C755]" />
          LINE Followers
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          People who have followed your LINE Official Account (@enjoyspeed)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total"
          value={stats.total}
          icon={<Users className="h-5 w-5 text-ink-muted" />}
        />
        <StatCard
          label="Following"
          value={stats.following}
          icon={<UserCheck className="h-5 w-5 text-[#06C755]" />}
          accent
        />
        <StatCard
          label="Unfollowed"
          value={stats.unfollowed}
          icon={<UserX className="h-5 w-5 text-red-400" />}
        />
        <StatCard
          label="Linked to Account"
          value={stats.linked}
          icon={<ExternalLink className="h-5 w-5 text-accent" />}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or LINE ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-sand/60 text-sm focus:border-ink focus:outline-none transition-colors bg-surface placeholder:text-ink-muted/60"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "following", "unfollowed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-ink text-cream shadow-sm"
                  : "bg-sand/30 text-ink-muted hover:bg-sand/50 hover:text-ink"
              }`}
            >
              {f === "all" ? "All" : f === "following" ? "Following" : "Unfollowed"}
            </button>
          ))}
          <button
            onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}
            className="px-3 py-2.5 rounded-xl bg-sand/30 text-ink-muted hover:bg-sand/50 hover:text-ink transition-all"
            title={`Sort by ${sortBy === "newest" ? "oldest" : "newest"} first`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Follower list */}
      {filtered.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-ink-muted/30 mx-auto mb-3" />
            <p className="text-ink-muted text-sm">
              {search ? "No followers match your search" : "No LINE followers yet"}
            </p>
            {!search && (
              <p className="text-xs text-ink-muted/60 mt-1">
                Followers appear here when people add your LINE Official Account
              </p>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted px-1">
            {filtered.length} follower{filtered.length !== 1 ? "s" : ""}
            {filter !== "all" && ` (${filter})`}
          </p>
          <AnimatePresence mode="popLayout">
            {filtered.map((follower, i) => (
              <motion.div
                key={follower.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card padding="sm">
                  <div className="p-3 flex items-center gap-4">
                    {/* Avatar */}
                    {follower.picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={follower.picture_url}
                        alt={follower.display_name || "LINE user"}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-sand/60 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#06C755]/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-5 w-5 text-[#06C755]" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">
                          {follower.display_name || "Unknown User"}
                        </span>
                        <Badge
                          variant={follower.is_following ? "success" : "default"}
                        >
                          {follower.is_following ? "Following" : "Unfollowed"}
                        </Badge>
                        {follower.user_id && (
                          <Badge variant="accent">Linked</Badge>
                        )}
                      </div>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Followed {timeAgo(follower.followed_at)}
                        {follower.unfollowed_at &&
                          ` · Unfollowed ${timeAgo(follower.unfollowed_at)}`}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className="text-xs text-ink-muted">
                        {formatDate(follower.followed_at, "medium")}
                      </p>
                      <p className="text-xs text-ink-muted/60 font-mono mt-0.5 truncate max-w-[120px]">
                        {follower.line_user_id.substring(0, 12)}...
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card padding="sm">
      <div className="p-3 flex items-center gap-3">
        {icon}
        <div>
          <p
            className={`text-xl font-bold ${
              accent ? "text-[#06C755]" : "text-ink"
            }`}
          >
            {value}
          </p>
          <p className="text-xs text-ink-muted">{label}</p>
        </div>
      </div>
    </Card>
  );
}
