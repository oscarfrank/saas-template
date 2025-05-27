<?php

namespace App\Mail;

use Modules\Email\Models\EmailTemplate;
use Modules\Email\Traits\UsesEmailTemplate;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\View;

class MailSend extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplate;

    public $template;
    public $data;
    public $subject;
    public $shortcode;

    /**
     * Create a new message instance.
     */
    public function __construct(string $shortcode, array $data, ?string $subject = null)
    {
        $this->shortcode = $shortcode;
        $this->data = $data;
        $this->template = $this->getEmailTemplate($shortcode);
        $this->subject = $subject ?? $this->template->name;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        if (!$this->template) {
            throw new \Exception("Email template not found for shortcode: {$this->shortcode}");
        }

        // Replace placeholders in the content
        $content = $this->replacePlaceholders($this->template->content, $this->data);
        
        // Format the content with proper HTML
        $formattedContent = $this->formatContent($content);
        
        // Render the template view with the formatted content
        $html = View::make('emails.template', [
            'content' => $formattedContent,
            'template' => $this->template,
            'data' => $this->data
        ])->render();
        
        return new Content(
            htmlString: $html
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
} 