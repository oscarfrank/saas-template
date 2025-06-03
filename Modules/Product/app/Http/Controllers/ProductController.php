<?php

namespace Modules\Product\Http\Controllers;

use Modules\Product\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use App\Http\Controllers\Controller;
class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Product::query();

        // Handle search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        if ($request->has('sort')) {
            $sort = $request->sort;
            $direction = $request->direction ?? 'asc';
            $query->orderBy($sort, $direction);
        }

        // Handle pagination
        $perPage = $request->per_page ?? 10;
        $products = $query->paginate($perPage);

        // Format image URLs for each product
        $formattedProducts = collect($products->items())->map(function ($product) {
            if ($product->featured_image) {
                $product->featured_image = asset('storage/' . $product->featured_image);
            }
            return $product;
        });

        return Inertia::render('products/admin/index', [
            'products' => $formattedProducts,
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('products/admin/form', [
            'mode' => 'create',
        ]);
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

            return redirect()->route('products.index', ['tenant' => tenant('id')])
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
        return Inertia::render('products/admin/show', [
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
        return Inertia::render('products/admin/form', [
            'product' => $product,
            'mode' => 'edit',
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
        try {
            // Delete the product image if it exists
            if ($product->featured_image) {
                Storage::disk('public')->delete($product->featured_image);
            }

            // Delete the product
            $product->delete();

            return redirect()->route('products.index', ['tenant' => tenant('id')])
                ->with('success', 'Product deleted successfully.');
        } catch (\Exception $e) {
            return back()->withErrors([
                'error' => 'Failed to delete product. Please try again.',
            ]);
        }
    }

    /**
     * Get all products for printing or exporting
     */
    public function getAllProducts()
    {
        
        \Log::info('getAllProducts method called');
        $products = Product::all()->map(function ($product) {
            if ($product->featured_image) {
                $product->featured_image = asset('storage/' . $product->featured_image);
            }
            return $product;
        });

        \Log::info('Products retrieved', ['count' => $products->count()]);
        return response()->json($products);
    }

    /**
     * Export all products as CSV
     */
    public function exportAllProducts()
    {
        $products = Product::all();
        $headers = ['Name', 'Description', 'Price', 'Created At'];
        
        $callback = function() use($products, $headers) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            
            foreach ($products as $product) {
                fputcsv($file, [
                    $product->name,
                    $product->description,
                    $product->price,
                    $product->created_at->format('Y-m-d H:i:s')
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="products_' . date('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Handle export requests through Inertia
     */
    public function export(Request $request)
    {
        $format = $request->input('format', 'csv');
        $products = Product::all();

        if ($format === 'csv') {
            $headers = ['Name', 'Description', 'Price', 'Created At'];
            $data = $products->map(function ($product) {
                return [
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'created_at' => $product->created_at->format('Y-m-d H:i:s')
                ];
            })->toArray();

            return response()->json([
                'format' => 'csv',
                'headers' => $headers,
                'data' => $data,
                'filename' => 'products_' . date('Y-m-d') . '.csv'
            ]);
        }

        if ($format === 'json') {
            $data = $products->map(function ($product) {
                if ($product->featured_image) {
                    $product->featured_image = asset('storage/' . $product->featured_image);
                }
                return $product;
            });

            return response()->json([
                'format' => 'json',
                'data' => $data,
                'filename' => 'products_' . date('Y-m-d') . '.json'
            ]);
        }

        return response()->json(['error' => 'Invalid format'], 400);
    }


}



