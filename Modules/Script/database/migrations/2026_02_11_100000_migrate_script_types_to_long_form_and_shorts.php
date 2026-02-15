<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Migrate script types from YouTube/TikTok/Instagram/Podcast/General to Long Form and Shorts.
     * - Creates "Long Form" and "Shorts" per tenant if missing.
     * - Reassigns scripts: youtube, instagram, podcast, general -> Long Form; tiktok -> Shorts.
     * - Removes old type rows for that tenant.
     */
    public function up(): void
    {
        $tenantIds = DB::table('script_types')->distinct()->pluck('tenant_id');

        foreach ($tenantIds as $tenantId) {
            $types = DB::table('script_types')->where('tenant_id', $tenantId)->get();

            $longFormId = $types->firstWhere('slug', 'long-form')?->id;
            $shortsId = $types->firstWhere('slug', 'shorts')?->id;

            $maxSort = $types->max('sort_order') ?? 0;

            if (! $longFormId) {
                $longFormId = DB::table('script_types')->insertGetId([
                    'tenant_id' => $tenantId,
                    'name' => 'Long Form',
                    'slug' => 'long-form',
                    'description' => null,
                    'is_active' => true,
                    'sort_order' => $maxSort + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            if (! $shortsId) {
                $shortsId = DB::table('script_types')->insertGetId([
                    'tenant_id' => $tenantId,
                    'name' => 'Shorts',
                    'slug' => 'shorts',
                    'description' => null,
                    'is_active' => true,
                    'sort_order' => $maxSort + 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            $toLongForm = $types->whereIn('slug', ['youtube', 'instagram', 'podcast', 'general'])->pluck('id')->all();
            $toShorts = $types->where('slug', 'tiktok')->pluck('id')->all();

            if (! empty($toLongForm)) {
                DB::table('scripts')->whereIn('script_type_id', $toLongForm)->update(['script_type_id' => $longFormId]);
            }
            if (! empty($toShorts)) {
                DB::table('scripts')->whereIn('script_type_id', $toShorts)->update(['script_type_id' => $shortsId]);
            }

            $oldSlugs = ['youtube', 'tiktok', 'instagram', 'podcast', 'general'];
            $oldIds = $types->whereIn('slug', $oldSlugs)->pluck('id')->all();
            if (! empty($oldIds)) {
                DB::table('script_types')->whereIn('id', $oldIds)->delete();
            }
        }
    }

    public function down(): void
    {
        // Cannot reliably restore old type names per tenant; leave as no-op or re-create old types and reassign heuristically.
        // Prefer not to reverse to avoid data loss.
    }
};
