<?php

namespace App\Services\Documents;

use RuntimeException;
use Smalot\PdfParser\Parser;

class DocumentExtractorService
{
    public function __construct(
        private readonly SimpleZipReader $zipReader,
    ) {}

    /**
     * @return array<int, array{page_number: int, section_title: ?string, text: string}>
     */
    public function extract(string $filePath, string $extension): array
    {
        $ext = strtolower($extension);

        return match ($ext) {
            'pdf' => $this->extractPdf($filePath),
            'docx' => $this->extractDocx($filePath),
            'pptx' => $this->extractPptx($filePath),
            'txt', 'md' => $this->extractPlainText($filePath),
            default => throw new RuntimeException("Format file .{$ext} belum didukung untuk ekstraksi teks."),
        };
    }

    /**
     * @return array<int, array{page_number: int, section_title: ?string, text: string}>
     */
    private function extractPdf(string $filePath): array
    {
        $parser = new Parser();
        $pdf = $parser->parseFile($filePath);
        $pages = $pdf->getPages();

        $results = [];
        foreach ($pages as $index => $page) {
            $text = $this->normalizeWhitespace($page->getText());
            if ($text !== '') {
                $results[] = [
                    'page_number' => $index + 1,
                    'section_title' => 'Halaman '.($index + 1),
                    'text' => $text,
                ];
            }
        }

        if ($results === []) {
            $fallbackText = $this->normalizeWhitespace($pdf->getText());
            if ($fallbackText !== '') {
                $results[] = [
                    'page_number' => 1,
                    'section_title' => 'Dokumen PDF',
                    'text' => $fallbackText,
                ];
            }
        }

        return $results;
    }

    /**
     * @return array<int, array{page_number: int, section_title: ?string, text: string}>
     */
    private function extractDocx(string $filePath): array
    {
        $entries = $this->zipReader->readEntries($filePath);
        $documentXml = $entries['word/document.xml'] ?? null;

        if (! is_string($documentXml)) {
            throw new RuntimeException('File DOCX tidak memiliki konten word/document.xml.');
        }

        $xml = @simplexml_load_string($documentXml);
        if ($xml === false) {
            throw new RuntimeException('Gagal mem-parsing XML dokumen DOCX.');
        }

        $paragraphs = [];
        foreach ($xml->xpath('//*[local-name()="p"]') ?: [] as $paragraph) {
            $texts = [];
            foreach ($paragraph->xpath('.//*[local-name()="t"]') ?: [] as $runText) {
                $texts[] = (string) $runText;
            }
            $line = $this->normalizeWhitespace(implode('', $texts));
            if ($line !== '') {
                $paragraphs[] = $line;
            }
        }

        $joined = implode("\n", $paragraphs);
        if ($joined === '') {
            return [];
        }

        return [[
            'page_number' => 1,
            'section_title' => 'Dokumen DOCX',
            'text' => $joined,
        ]];
    }

    /**
     * @return array<int, array{page_number: int, section_title: ?string, text: string}>
     */
    private function extractPptx(string $filePath): array
    {
        $entries = $this->zipReader->readEntries($filePath);
        $slides = [];

        foreach ($entries as $name => $content) {
            if (preg_match('/^ppt\/slides\/slide(\d+)\.xml$/', $name, $matches)) {
                $slides[(int) $matches[1]] = $content;
            }
        }

        ksort($slides);

        $results = [];
        foreach ($slides as $slideNumber => $slideXml) {
            $xml = @simplexml_load_string($slideXml);
            if ($xml === false) {
                continue;
            }

            $texts = [];
            foreach ($xml->xpath('//*[local-name()="t"]') ?: [] as $node) {
                $value = trim((string) $node);
                if ($value !== '') {
                    $texts[] = $value;
                }
            }

            $joined = $this->normalizeWhitespace(implode("\n", $texts));
            if ($joined !== '') {
                $results[] = [
                    'page_number' => $slideNumber,
                    'section_title' => "Slide {$slideNumber}",
                    'text' => $joined,
                ];
            }
        }

        return $results;
    }

    /**
     * @return array<int, array{page_number: int, section_title: ?string, text: string}>
     */
    private function extractPlainText(string $filePath): array
    {
        $raw = @file_get_contents($filePath);
        if ($raw === false) {
            throw new RuntimeException('Tidak dapat membaca file teks.');
        }

        $text = $this->normalizeWhitespace($raw);
        if ($text === '') {
            return [];
        }

        return [[
            'page_number' => 1,
            'section_title' => 'Dokumen Teks',
            'text' => $text,
        ]];
    }

    private function normalizeWhitespace(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[ \t]+/', ' ', $text) ?? $text;
        $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

        return trim($text);
    }
}
