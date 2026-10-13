<?php

namespace App\Http\Controllers;

use App\Mail\GuestMessage;
use App\Models\AuditLog;
use App\Models\MessageTemplate;
use App\Services\GuestMessenger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AdminMessageController extends Controller
{
    public function index(Request $request, GuestMessenger $messenger)
    {
        $tenant = $request->user()->tenant;

        return Inertia::render('Admin/Messages', [
            'templates' => collect(GuestMessenger::EVENTS)->map(fn ($label, $event) => ['event' => $event, 'label' => $label,
                'defaults' => config("platform.message_defaults.{$event}"), ...$messenger->template($tenant, $event)])->values(),
            'placeholders' => GuestMessenger::placeholders(),
            'sample' => $messenger->sampleValues($tenant),
        ]);
    }

    public function update(Request $request, string $event)
    {
        abort_unless(array_key_exists($event, GuestMessenger::EVENTS), 404);
        $data = $request->validate([
            'enabled' => 'required|boolean',
            'subject' => 'required|string|max:150',
            'body' => 'required|string|max:5000',
            'send_days_before' => $event === 'pre_arrival' ? 'required|integer|min:0|max:30' : 'prohibited',
        ]);
        $tenantId = $request->user()->tenant_id;
        MessageTemplate::updateOrCreate(['tenant_id' => $tenantId, 'event' => $event], $data);
        $this->audit($request, 'message_template.updated', $event);

        return back()->with('success', 'Message saved.');
    }

    public function destroy(Request $request, string $event)
    {
        abort_unless(array_key_exists($event, GuestMessenger::EVENTS), 404);
        MessageTemplate::where('tenant_id', $request->user()->tenant_id)->where('event', $event)->delete();
        $this->audit($request, 'message_template.reset', $event);

        return back()->with('success', 'Message reset to the default.');
    }

    /** Send the current draft, filled with sample booking details, to the signed-in admin. */
    public function test(Request $request, GuestMessenger $messenger, string $event)
    {
        abort_unless(array_key_exists($event, GuestMessenger::EVENTS), 404);
        $data = $request->validate(['subject' => 'required|string|max:150', 'body' => 'required|string|max:5000']);
        $tenant = $request->user()->tenant;
        $values = $messenger->sampleValues($tenant);
        Mail::to($request->user()->email)->send(new GuestMessage($tenant, '[Test] '.$messenger->render($data['subject'], $values), $messenger->render($data['body'], $values)));

        return back()->with('success', 'Test email sent to '.$request->user()->email.'.');
    }

    private function audit(Request $request, string $action, string $event): void
    {
        AuditLog::create(['actor_user_id' => $request->user()->id, 'tenant_id' => $request->user()->tenant_id,
            'action' => $action, 'entity_type' => 'Tenant', 'entity_id' => $request->user()->tenant_id,
            'metadata' => ['event' => $event], 'ip_address' => $request->ip()]);
    }
}
