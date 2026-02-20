<?php

namespace Modules\Pages\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Settings\Models\SiteSettings;

class PagesController extends Controller
{
    /**
     * Resolve the active homepage theme from site settings (must exist in config).
     * When maintenance mode is on, the maintenance theme is shown for all public pages.
     */
    protected function theme(): string
    {
        $settings = SiteSettings::getSettings();
        if (! empty($settings->maintenance_mode)) {
            return 'maintenance';
        }
        $theme = $settings->homepage_theme ?? 'lending';
        $allowed = array_keys(config('homepage.themes', ['lending' => 'Lending']));

        return in_array($theme, $allowed, true) ? $theme : 'lending';
    }

    /**
     * When theme is "redirect", redirect to the configured URL (root and all public theme pages).
     * Returns a redirect response or null if theme is not redirect or URL is missing.
     */
    protected function redirectIfRedirectTheme(): ?\Illuminate\Http\RedirectResponse
    {
        if ($this->theme() !== 'redirect') {
            return null;
        }
        $url = SiteSettings::getSettings()->homepage_redirect_url;
        if (empty($url) || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        return redirect()->away($url);
    }

    /**
     * Render a homepage theme page. Falls back to lending theme if the theme has no page.
     */
    protected function renderHomepagePage(string $page): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        $redirect = $this->redirectIfRedirectTheme();
        if ($redirect !== null) {
            return $redirect;
        }
        $theme = $this->theme();
        $view = "homepage/{$theme}/{$page}";

        return Inertia::render($view);
    }

    /**
     * Display the homepage (welcome).
     */
    public function index(Request $request)
    {
        return $this->renderHomepagePage('welcome');
    }

    public function faq(Request $request)
    {
        return $this->renderHomepagePage('faq');
    }

    public function contact(Request $request)
    {
        return $this->renderHomepagePage('contact');
    }

    public function calculator(Request $request)
    {
        return $this->renderHomepagePage('calculator');
    }

    public function privacy(Request $request)
    {
        return $this->renderHomepagePage('privacy');
    }

    public function about(Request $request)
    {
        return $this->renderHomepagePage('about');
    }

    

    public function adminDashboard(Request $request)
    {
        return redirect()->route('admin.dashboard');
    }

    public function lenderDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/lender-dashboard');
    }

    public function borrowerDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/borrower-dashboard');
    }

    public function youtuberDashboard(Request $request)
    {
        return Inertia::render('dashboard/user/youtuber-dashboard');
    }
    
    




}
