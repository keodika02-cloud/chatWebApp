<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->words(3, true),
            'sku' => $this->faker->unique()->bothify('SP-###-???'),
            'price' => $this->faker->randomFloat(2, 100000, 50000000),
            'stock' => $this->faker->numberBetween(10, 100),
            'image_url' => 'https://via.placeholder.com/150',
            'description' => $this->faker->sentence(),
        ];
    }
}
