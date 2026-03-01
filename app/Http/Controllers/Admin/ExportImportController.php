<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\ExportImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportImportController extends Controller
{
    public function __construct(
        protected ExportImportService $exportImport
    ) {}

    protected function ensureSuperAdmin(): void
    {
        $user = auth()->user();
        if (! $user || (! $user->hasRole('superadmin') && ! $user->hasRole('super-admin'))) {
            abort(403, 'Only super administrators can export or import data.');
        }
    }

    /**
     * Export / Import page (super admin only).
     */
    public function index()
    {
        $this->ensureSuperAdmin();
        return Inertia::render('admin/export-import', [
            'sections' => ExportImportService::getAvailableSections(),
        ]);
    }

    /**
     * Export selected sections as JSON or XML file (GET so browser can download directly).
     */
    public function export(Request $request): StreamedResponse
    {
        $this->ensureSuperAdmin();
        $format = $request->query('format', $request->input('format', 'json'));
        if (! in_array($format, ['json', 'xml'], true)) {
            $format = 'json';
        }
        $include = $request->query('include') ?? $request->input('include', []);
        if (is_string($include)) {
            $include = array_filter(array_map('trim', explode(',', $include)));
        }

        $data = $this->exportImport->exportToArray($include ?: null);

        $filename = 'export-' . now()->format('Y-m-d-His') . '.' . $format;

        if ($format === 'xml') {
            $content = $this->exportImport->arrayToXml($data, 'export');
            return response()->streamDownload(
                function () use ($content) {
                    echo $content;
                },
                $filename,
                [
                    'Content-Type' => 'application/xml',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]
            );
        }

        return response()->streamDownload(
            function () use ($data) {
                echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            },
            $filename,
            [
                'Content-Type' => 'application/json',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]
        );
    }

    /**
     * Import from uploaded JSON or XML file.
     */
    public function import(Request $request)
    {
        $this->ensureSuperAdmin();
        $request->validate([
            'file' => 'required|file|mimes:json,xml|max:512000', // 512MB max
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $content = $file->get();

        try {
            if ($extension === 'xml') {
                $data = $this->exportImport->xmlToArray($content);
                // SimpleXML wraps in root key; normalize to our export shape
                if (isset($data['@attributes'])) {
                    unset($data['@attributes']);
                }
                $data = $this->normalizeXmlExport($data);
            } else {
                $data = json_decode($content, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \InvalidArgumentException('Invalid JSON: ' . json_last_error_msg());
                }
            }

            $include = $request->input('include', []);
            if (is_string($include)) {
                $include = array_filter(array_map('trim', explode(',', $include)));
            }
            $this->exportImport->importFromArray($data, $include ?: null);
        } catch (\Throwable $e) {
            Log::error('Export/Import: import failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->with('error', 'Import failed: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Import completed successfully.');
    }

    /**
     * Normalize SimpleXML-decoded array back to export shape (central.tenants, central.users, etc.).
     */
    protected function normalizeXmlExport(array $data): array
    {
        // SimpleXML gives us nested arrays with possibly different key names; try to match our export structure
        $out = ['version' => (int) ($data['version'] ?? 1), 'exported_at' => $data['exported_at'] ?? null];
        if (isset($data['central']) && is_array($data['central'])) {
            $out['central'] = $data['central'];
        } else {
            $out['central'] = ['tenants' => [], 'users' => [], 'tenant_user' => [], 'site_settings' => []];
        }
        if (isset($data['tenant_data']) && is_array($data['tenant_data'])) {
            $out['tenant_data'] = $data['tenant_data'];
        } else {
            $out['tenant_data'] = [];
        }
        return $out;
    }
}
