export type PulseFeedRow = {
    id: number;
    name: string;
    feed_url: string;
    enabled: boolean;
    last_fetched_at: string | null;
    item_count: number;
    fetch_error: string | null;
};

export type PulseDigestIdea = {
    title: string;
    hook: string;
    angle?: string | null;
};

export type PulseDigest = {
    digest_date: string;
    feeds_status: string;
    ideas_status: string;
    feeds_refreshed_at: string | null;
    ideas_generated_at: string | null;
    feeds_error: string | null;
    ideas_error: string | null;
    intro_summary: string | null;
    tweets: PulseDigestIdea[];
    shorts: PulseDigestIdea[];
    youtube: PulseDigestIdea[];
};

export type PulseDigestHistoryDay = {
    digest_date: string;
    label: string;
    has_digest: boolean;
    feeds_status: string | null;
    ideas_status: string | null;
};
