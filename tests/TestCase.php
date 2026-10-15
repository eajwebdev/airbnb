<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        // Feature tests exercise Inertia responses, not compiled assets. This keeps
        // a fresh checkout testable before npm install/build creates a manifest.
        $this->withoutVite();
    }
}
