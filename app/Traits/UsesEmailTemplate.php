<?php

namespace App\Traits;

use App\Models\EmailTemplate;

trait UsesEmailTemplate
{
    protected function getEmailTemplate(string $shortcode): ?EmailTemplate
    {
        return EmailTemplate::where('shortcode', $shortcode)
            ->where('is_active', true)
            ->first();
    }

    protected function replacePlaceholders(string $content, array $replacements): string
    {
        return str_replace(array_keys($replacements), array_values($replacements), $content);
    }

    protected function formatContent(string $content): string
    {
        // First, convert newlines to <br> tags
        $content = nl2br($content);
        
        // Split content into paragraphs (by double newlines)
        $paragraphs = explode('<br /><br />', $content);
        
        // Format each paragraph
        $formattedParagraphs = array_map(function($paragraph) {
            // Clean up any remaining <br> tags
            $paragraph = str_replace('<br />', '', $paragraph);
            // Trim whitespace
            $paragraph = trim($paragraph);
            // Wrap in <p> tags if not empty
            return $paragraph ? "<p>{$paragraph}</p>" : '';
        }, $paragraphs);
        
        // Join paragraphs with proper spacing
        $content = implode("\n", array_filter($formattedParagraphs));
        
        // Add proper spacing between paragraphs
        $content = str_replace('</p><p>', "</p>\n<p>", $content);
        
        return $content;
    }
} 