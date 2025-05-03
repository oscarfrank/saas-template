<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class DownloadProductImages extends Command
{
    protected $signature = 'products:download-images';
    protected $description = 'Download product images from URLs and update the database';

    public function handle()
    {
        $this->info('Starting image download process...');

        // Ensure the storage directory exists
        Storage::disk('public')->makeDirectory('images/products');

        $products = Product::all();
        $total = $products->count();
        $success = 0;
        $failed = 0;

        foreach ($products as $product) {
            $this->info("Processing product: {$product->name}");

            if (empty($product->featured_image) || !filter_var($product->featured_image, FILTER_VALIDATE_URL)) {
                $this->warn("Skipping product {$product->name} - invalid or empty image URL");
                $failed++;
                continue;
            }

            try {
                // Download the image
                $response = Http::get($product->featured_image);
                
                if (!$response->successful()) {
                    throw new \Exception("Failed to download image: HTTP {$response->status()}");
                }

                // Generate a unique filename
                $extension = pathinfo($product->featured_image_original_name, PATHINFO_EXTENSION) ?: 'jpg';
                $filename = uniqid() . '.' . $extension;
                $path = 'images/products/' . $filename;

                // Save the image
                Storage::disk('public')->put($path, $response->body());

                // Update the product
                $product->update([
                    'featured_image' => $path,
                    'featured_image_original_name' => $filename,
                ]);

                $this->info("Successfully downloaded and saved image for {$product->name}");
                $success++;
            } catch (\Exception $e) {
                $this->error("Failed to process {$product->name}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("\nDownload process completed!");
        $this->info("Total products processed: {$total}");
        $this->info("Successful downloads: {$success}");
        $this->info("Failed downloads: {$failed}");
    }
} 