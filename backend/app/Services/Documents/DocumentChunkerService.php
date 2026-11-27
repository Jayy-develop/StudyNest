<?php

namespace App\Services\Documents;

class DocumentChunkerService
{
    /**
     * @param  array<int, array{page_number: int, section_title: ?string, text: string}>  $pages
     * @return array<int, array{chunk_index: int, page_number: int, section_title: ?string, content: string, token_estimate: int}>
     */
    public function chunk(array $pages, int $maxChars = 900, int $overlapChars = 150): array
    {
        $chunks = [];
        $chunkIndex = 0;

        foreach ($pages as $page) {
            $text = trim($page['text']);
            if ($text === '') {
                continue;
            }

            $length = mb_strlen($text);
            if ($length <= $maxChars) {
                $chunks[] = [
                    'chunk_index' => $chunkIndex++,
                    'page_number' => $page['page_number'],
                    'section_title' => $page['section_title'],
                    'content' => $text,
                    'token_estimate' => max(1, (int) ceil($length / 4)),
                ];
                continue;
            }

            $cursor = 0;
            while ($cursor < $length) {
                $slice = mb_substr($text, $cursor, $maxChars);

                if ($cursor + $maxChars < $length) {
                    $lastBreak = max(
                        (int) mb_strrpos($slice, "\n"),
                        (int) mb_strrpos($slice, '. '),
                        (int) mb_strrpos($slice, ' ')
                    );
                    if ($lastBreak > (int) ($maxChars * 0.5)) {
                        $slice = mb_substr($slice, 0, $lastBreak + 1);
                    }
                }

                $trimmed = trim($slice);
                if ($trimmed !== '') {
                    $chunks[] = [
                        'chunk_index' => $chunkIndex++,
                        'page_number' => $page['page_number'],
                        'section_title' => $page['section_title'],
                        'content' => $trimmed,
                        'token_estimate' => max(1, (int) ceil(mb_strlen($trimmed) / 4)),
                    ];
                }

                $advance = max(1, mb_strlen($slice) - $overlapChars);
                $cursor += $advance;
            }
        }

        return $chunks;
    }
}
