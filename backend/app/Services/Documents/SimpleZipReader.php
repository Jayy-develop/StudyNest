<?php

namespace App\Services\Documents;

use RuntimeException;

class SimpleZipReader
{
    /**
     * Read all entries from a ZIP archive into [entryName => rawContent].
     * Uses ZipArchive when available and falls back to pure-PHP parsing with gzinflate.
     *
     * @return array<string, string>
     */
    public function readEntries(string $filePath): array
    {
        if (class_exists(\ZipArchive::class)) {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                $entries = [];
                for ($i = 0; $i < $zip->numFiles; $i++) {
                    $name = $zip->getNameIndex($i);
                    if ($name !== false) {
                        $content = $zip->getFromIndex($i);
                        if ($content !== false) {
                            $entries[$name] = $content;
                        }
                    }
                }
                $zip->close();

                return $entries;
            }
        }

        $data = @file_get_contents($filePath);
        if ($data === false) {
            throw new RuntimeException('Tidak dapat membaca file arsip dokumen.');
        }

        return $this->parseCentralDirectory($data);
    }

    /**
     * @return array<string, string>
     */
    private function parseCentralDirectory(string $data): array
    {
        $eocdPos = strrpos($data, "\x50\x4b\x05\x06");
        if ($eocdPos === false || strlen($data) < $eocdPos + 22) {
            throw new RuntimeException('Format file Office/ZIP tidak valid.');
        }

        $eocd = unpack('vtotalEntries/VcdSize/VcdOffset', substr($data, $eocdPos + 10, 10));
        if (! is_array($eocd)) {
            throw new RuntimeException('Gagal membaca direktori ZIP.');
        }

        $entries = [];
        $offset = $eocd['cdOffset'];
        $total = $eocd['totalEntries'];

        for ($i = 0; $i < $total; $i++) {
            if (substr($data, $offset, 4) !== "\x50\x4b\x01\x02") {
                break;
            }

            $header = unpack(
                'vmethod/Vcrc/VcompSize/VuncompSize/vnameLen/vextraLen/vcommentLen',
                substr($data, $offset + 10, 24)
            );
            $localHeaderOffset = unpack('Voffset', substr($data, $offset + 42, 4))['offset'];
            $name = substr($data, $offset + 46, $header['nameLen']);
            $offset += 46 + $header['nameLen'] + $header['extraLen'] + $header['commentLen'];

            if (str_ends_with($name, '/')) {
                continue;
            }

            if (substr($data, $localHeaderOffset, 4) !== "\x50\x4b\x03\x04") {
                continue;
            }

            $localLengths = unpack('vnameLen/vextraLen', substr($data, $localHeaderOffset + 26, 4));
            $dataStart = $localHeaderOffset + 30 + $localLengths['nameLen'] + $localLengths['extraLen'];
            $compressed = substr($data, $dataStart, $header['compSize']);

            if ($header['method'] === 0) {
                $entries[$name] = $compressed;
            } elseif ($header['method'] === 8) {
                $inflated = @gzinflate($compressed);
                if ($inflated !== false) {
                    $entries[$name] = $inflated;
                }
            }
        }

        return $entries;
    }
}
