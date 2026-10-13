<?php

namespace Tests\Feature;

use Tests\TestCase;

class QuotationPageTest extends TestCase
{
    public function test_quotation_and_its_assets_are_available(): void
    {
        $this->get('/quotation')->assertRedirect('/quotation/index.html');
        $this->get('/quotation/index.html')->assertOk();
        $this->get('/quotation/app.js')->assertOk();
        $this->get('/quotation/modules.css')->assertOk();
    }

    public function test_quote_browser_url_opens_quotation_without_breaking_pricing_api(): void
    {
        $this->withHeader('Accept', 'text/html')->get('/quote')->assertRedirect('/quotation');
        $this->withHeader('Accept', 'application/json')->get('/quote')->assertUnprocessable();
    }
}
