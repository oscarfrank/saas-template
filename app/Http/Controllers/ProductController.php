<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = Product::all()->map(function ($product) {
            if ($product->featured_image) {
                $product->featured_image = asset('storage/' . $product->featured_image);
            }
            return $product;
        });
        return Inertia::render('products/index', [
            'products' => $products,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('products/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'price' => 'required|numeric|min:0',
                'image' => 'nullable|image|max:2048', // Max 2MB, optional
            ]);

            // Handle file upload if an image is provided
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $path = $file->store('images/products', 'public');
                $validated['featured_image'] = $path;
                $validated['featured_image_original_name'] = $file->getClientOriginalName();
            }

            // Create the product
            $product = Product::create($validated);

            return redirect()->route('products.index')
                ->with('success', 'Product created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        if ($product->featured_image) {
            $product->featured_image = asset('storage/' . $product->featured_image);
        }
        return Inertia::render('products/show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        if ($product->featured_image) {
            $product->featured_image = asset('storage/' . $product->featured_image);
        }
        return Inertia::render('products/edit', [
            'product' => $product,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|max:2048', // Max 2MB, optional for updates
        ]);

        // Handle file upload if a new image is provided
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('images/products', 'public');
            $validated['featured_image'] = $path;
            $validated['featured_image_original_name'] = $file->getClientOriginalName();
        }

        // Remove the image field from validated data as it's not a database column
        unset($validated['image']);

        // Update the product
        $product->update($validated);

        return back()->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        //
    }
}
