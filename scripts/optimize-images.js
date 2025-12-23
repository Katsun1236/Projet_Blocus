#!/usr/bin/env node

/**
 * Script d'optimisation des images
 * Convertit les images PNG/JPG en WebP pour réduire la taille
 *
 * Usage: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../assets/images');
const QUALITY = 85; // Qualité WebP (85 = bon compromis qualité/taille)
const MIN_SIZE_KB = 100; // Convertir seulement les images > 100KB

async function optimizeImages() {
    console.log('🖼️  Optimisation des images...\n');

    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(f => /\.(png|jpg|jpeg)$/i.test(f));

    let totalSaved = 0;
    let converted = 0;

    for (const file of imageFiles) {
        const inputPath = path.join(IMAGES_DIR, file);
        const stats = fs.statSync(inputPath);
        const sizeKB = stats.size / 1024;

        // Convertir seulement si > MIN_SIZE_KB
        if (sizeKB < MIN_SIZE_KB) {
            console.log(`⏭️  ${file} (${sizeKB.toFixed(1)}KB) - Trop petit, ignoré`);
            continue;
        }

        const outputFileName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const outputPath = path.join(IMAGES_DIR, outputFileName);

        try {
            await sharp(inputPath)
                .webp({ quality: QUALITY })
                .toFile(outputPath);

            const newStats = fs.statSync(outputPath);
            const newSizeKB = newStats.size / 1024;
            const saved = sizeKB - newSizeKB;
            const savedPercent = ((saved / sizeKB) * 100).toFixed(1);

            totalSaved += saved;
            converted++;

            console.log(`✅ ${file}`);
            console.log(`   Avant: ${sizeKB.toFixed(1)}KB → Après: ${newSizeKB.toFixed(1)}KB`);
            console.log(`   Économie: ${saved.toFixed(1)}KB (${savedPercent}%)\n`);

        } catch (error) {
            console.error(`❌ Erreur avec ${file}:`, error.message);
        }
    }

    console.log('\n📊 Résumé:');
    console.log(`   Images converties: ${converted}`);
    console.log(`   Espace économisé: ${(totalSaved / 1024).toFixed(2)}MB`);
    console.log(`   Gain moyen: ${converted > 0 ? (totalSaved / converted / 1024).toFixed(2) : 0}MB par image`);

    if (converted > 0) {
        console.log('\n⚠️  N\'oubliez pas de mettre à jour les chemins d\'images dans le HTML:');
        console.log('   image.png → image.webp');
        console.log('   Et ajouter un fallback pour les navigateurs anciens.');
    }
}

// Vérifier si sharp est installé
try {
    require.resolve('sharp');
    optimizeImages().catch(console.error);
} catch (e) {
    console.error('❌ Sharp n\'est pas installé.');
    console.log('\n📦 Installation:');
    console.log('   npm install sharp --save-dev');
    console.log('\nPuis relancez: node scripts/optimize-images.js');
    process.exit(1);
}
