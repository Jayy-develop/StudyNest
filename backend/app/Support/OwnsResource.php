<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

trait OwnsResource
{
    protected function authorizeOwnership(Request $request, Model $resource, string $message = 'Anda tidak memiliki akses ke data ini.'): void
    {
        if ((int) $resource->getAttribute('user_id') !== (int) $request->user()->id) {
            abort(403, $message);
        }
    }
}
