<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key and Organization
    |--------------------------------------------------------------------------
    |
    | Here you may specify your OpenAI API Key and organization. This will be
    | used to authenticate with the OpenAI API - you can find your API key
    | and organization on your OpenAI dashboard, at https://openai.com.
    */

    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI API Project
    |--------------------------------------------------------------------------
    |
    | Here you may specify your OpenAI API project. This is used optionally in
    | situations where you are using a legacy user API key and need association
    | with a project. This is not required for the newer API keys.
    */
    'project' => env('OPENAI_PROJECT'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI Base URL
    |--------------------------------------------------------------------------
    |
    | Here you may specify your OpenAI API base URL used to make requests. This
    | is needed if using a custom API endpoint. Defaults to: api.openai.com/v1
    */
    'base_uri' => env('OPENAI_BASE_URL'),

    /*
    |--------------------------------------------------------------------------
    | Request Timeout
    |--------------------------------------------------------------------------
    |
    | The timeout may be used to specify the maximum number of seconds to wait
    | for a response. Default 30s; use 120–180 for long operations (e.g. script
    | retention analysis). Set OPENAI_REQUEST_TIMEOUT in .env to override.
    */

    'request_timeout' => env('OPENAI_REQUEST_TIMEOUT', 120),

    /*
    |--------------------------------------------------------------------------
    | Chat Model
    |--------------------------------------------------------------------------
    |
    | The model used for chat completions (e.g. title generation). Examples:
    | gpt-4o-mini, gpt-4o, gpt-4-turbo
    |
    */

    'chat_model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),

    /*
    |--------------------------------------------------------------------------
    | Mirage reference photos (vision)
    |--------------------------------------------------------------------------
    |
    | Summarizes optional face/product uploads before thumbnail ideation.
    |
    */

    'mirage_reference_vision_model' => env('OPENAI_MIRAGE_REFERENCE_VISION_MODEL', 'gpt-4o-mini'),

    /*
    |--------------------------------------------------------------------------
    | Image generation (DALL·E / GPT Image)
    |--------------------------------------------------------------------------
    |
    | Used by Cortex Mirage thumbnail image generation. DALL·E 3 supports
    | sizes: 1024x1024, 1792x1024, 1024x1792 and quality: standard | hd.
    |
    */

    'image_model' => env('OPENAI_IMAGE_MODEL', 'dall-e-3'),

    'image_size' => env('OPENAI_IMAGE_SIZE', '1792x1024'),

    'image_quality' => env('OPENAI_IMAGE_QUALITY', 'standard'),

    /*
    |--------------------------------------------------------------------------
    | GPT Image model id (generations + edits with reference photos)
    |--------------------------------------------------------------------------
    |
    | Examples: gpt-image-1, gpt-image-1-mini, gpt-image-1.5
    |
    */

    'gpt_image_model' => env('OPENAI_GPT_IMAGE_MODEL', 'gpt-image-1'),

    /*
    |--------------------------------------------------------------------------
    | GPT Image 1 size (OpenAI)
    |--------------------------------------------------------------------------
    |
    | Used when Mirage image provider is “GPT Image 1”. Common values include
    | 1024x1024, 1536x1024, 1024x1536. See OpenAI Images API docs.
    |
    */

    'gpt_image_size' => env('OPENAI_GPT_IMAGE_SIZE', '1536x1024'),

    /*
    | GPT Image models: quality low|medium|high|auto, output png|jpeg|webp.
    | See OpenAI Images API — GPT Image does not return hosted URLs; responses
    | use base64, which Mirage converts to a data URL for the browser.
    */
    'gpt_image_quality' => env('OPENAI_GPT_IMAGE_QUALITY', 'auto'),

    'gpt_image_output_format' => env('OPENAI_GPT_IMAGE_OUTPUT_FORMAT', 'png'),
];
