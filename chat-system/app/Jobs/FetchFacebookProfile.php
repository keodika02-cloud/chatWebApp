<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchFacebookProfile implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $socialAccount;
    protected $senderId;

    /**
     * Create a new job instance.
     */
    public function __construct($socialAccount, $senderId)
    {
        $this->socialAccount = $socialAccount;
        $this->senderId = $senderId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $pageAccessToken = config('services.facebook.page_access_token');
            // Gọi Facebook Graph API
            $response = Http::get("https://graph.facebook.com/{$this->senderId}", [
                'fields' => 'first_name,last_name,profile_pic',
                'access_token' => $pageAccessToken
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $firstName = $data['first_name'] ?? '';
                $lastName = $data['last_name'] ?? '';
                $fullName = trim("$firstName $lastName");
                $profilePic = $data['profile_pic'] ?? $this->socialAccount->avatar;

                if ($fullName) {
                    // Update Social Account
                    $this->socialAccount->update([
                        'name' => $fullName,
                        'avatar' => $profilePic
                    ]);

                    // Update Customer info too
                    if ($this->socialAccount->customer) {
                        $this->socialAccount->customer->update([
                            'full_name' => $fullName
                        ]);
                    }
                    
                    Log::info("Job: Updated FB Profile for: $fullName");
                }
            } else {
                Log::warning("Job: FB Profile fetch failed: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error("Job: fetchFacebookProfile Error: " . $e->getMessage());
        }
    }
}
