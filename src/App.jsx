import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, FileText, PlayCircle, Home, Award } from 'lucide-react';

// --- DATA BUILDER HELPERS ---
const valMap = {A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, J:9, K:0};
const getVal = (str) => parseInt(str.split('').map(char => valMap[char]).join(''), 10);
const toLetters = (num) => num.toString().split('').map(digit => Object.keys(valMap).find(k => valMap[k] == digit)).join('');

// Generator Pembahasan Otomatis untuk Tes 2 dan Tes 5
const explainLetters = (text, ans) => {
  try {
    const [left, right] = text.split(' = ');
    const parts = left.split(' x ');
    if (parts.length !== 2) return `Kunci: A=1...K=0. Perhitungan untuk ${text} adalah ${ans === 'b' ? 'BENAR' : 'SALAH'}.`;
    
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    const r = right.trim();

    const v1 = getVal(p1);
    const v2 = getVal(p2);
    const vr = getVal(r);
    const correctResult = v1 * v2;
    const correctLetters = toLetters(correctResult);

    if (ans === 'b') {
      return `${p1}=${v1}, ${p2}=${v2}. Maka ${v1} x ${v2} = ${correctResult}. Angka ${correctResult} adalah ${correctLetters}. Sesuai dengan soal yang tertulis ${r}, maka jawabannya BENAR.`;
    } else {
      return `${p1}=${v1}, ${p2}=${v2}. Maka ${v1} x ${v2} = ${correctResult}. Angka ${correctResult} seharusnya ditulis ${correctLetters}. Namun di soal tertulis ${r} (bernilai ${vr}), sehingga jawabannya SALAH.`;
    }
  } catch(e) {
    return `Kunci: A=1...K=0. Perhitungan untuk ${text} adalah ${ans === 'b' ? 'BENAR' : 'SALAH'}.`;
  }
};

const buildTF = (texts, answers, startIndex = 1) => texts.map((t, i) => ({
  id: `q${startIndex + i}`,
  text: `${startIndex + i}) ${t}`,
  options: [{ id: 'b', text: 'Benar (b)' }, { id: 's', text: 'Salah (s)' }],
  correctAnswer: answers[i],
  explanation: explainLetters(t, answers[i])
}));

const buildMC = (data, startIndex = 1) => data.map((d, i) => ({
  id: `q${startIndex + i}`,
  text: `${startIndex + i}) ${d[0]}`,
  options: d[1].map((opt, j) => ({ id: ['a','b','c','d','e'][j], text: opt })),
  correctAnswer: d[2],
  explanation: d[3] || "Sesuai dengan hasil perhitungan matematika yang benar."
}));

const getResultFeedback = (score, totalSeconds) => {
  const scoreBand = score <= 50 ? 'low' : score <= 80 ? 'mid' : 'high';
  const timeBand = totalSeconds <= 300 ? 'fast' : totalSeconds <= 600 ? 'steady' : 'slow';

  const scoreLabel = scoreBand === 'low' ? 'Skor 0-50%' : scoreBand === 'mid' ? 'Skor 51-80%' : 'Skor 81-100%';
  const timeLabel = timeBand === 'fast' ? 'Waktu 0-5 menit' : timeBand === 'steady' ? 'Waktu 5-10 menit' : 'Waktu di atas 10 menit';

  const feedbackMap = {
    low: {
      fast: {
        title: 'Perlu menurunkan tempo dan menaikkan ketelitian',
        review: 'Kamu mengerjakan dengan cepat, tetapi banyak jawaban masih belum tepat. Ini biasanya terjadi saat tempo terlalu tinggi sehingga langkah hitung belum sempat dicek ulang.',
        motivation: 'Kamu sudah punya keberanian mengambil keputusan cepat. Langkah berikutnya adalah memperlambat sedikit ritme dan membiasakan cek singkat sebelum pindah ke soal berikutnya.'
      },
      steady: {
        title: 'Dasar hitungan masih perlu diperkuat',
        review: 'Kamu sudah meluangkan waktu yang cukup, tetapi ketepatan jawaban masih belum stabil. Artinya fokus utama saat ini adalah menguatkan pola dasar dan mengurangi kesalahan sederhana.',
        motivation: 'Jangan khawatir dengan hasil ini. Dengan latihan rutin pada soal-soal dasar, kemampuanmu bisa naik cukup cepat karena pondasinya bisa dibangun langkah demi langkah.'
      },
      slow: {
        title: 'Butuh latihan dasar yang lebih terarah',
        review: 'Kamu sudah berusaha teliti dan menghabiskan waktu lebih lama, tetapi hasilnya masih belum sesuai target. Ini menunjukkan kamu perlu lebih banyak pengulangan pada konsep dasar agar waktu dan akurasi bisa tumbuh bersama.',
        motivation: 'Usahamu sudah terlihat dari waktu pengerjaan. Sekarang arahkan energi itu ke latihan bertahap, mulai dari soal yang paling sederhana sampai pola yang lebih kompleks.'
      }
    },
    mid: {
      fast: {
        title: 'Kecepatan sudah bagus, ketelitian tinggal dirapikan',
        review: 'Hasilmu sudah cukup baik dengan tempo yang cepat. Masih ada beberapa jawaban yang meleset, tetapi secara umum kamu sudah punya dasar hitung dan ritme kerja yang bagus.',
        motivation: 'Kalau kamu menambahkan kebiasaan cek cepat di soal-soal yang rawan jebakan, nilaimu sangat mungkin naik ke level atas.'
      },
      steady: {
        title: 'Performa sudah cukup seimbang',
        review: 'Kamu mengerjakan dengan tempo yang wajar dan hasil yang cukup stabil. Ini menunjukkan pemahamanmu sudah baik, hanya masih perlu konsistensi di beberapa nomor.',
        motivation: 'Kamu sudah berada di jalur yang benar. Dengan latihan rutin dan evaluasi soal yang salah, hasilmu bisa naik menjadi sangat kuat.'
      },
      slow: {
        title: 'Akurasi cukup baik, tapi waktu masih bisa dipersingkat',
        review: 'Kamu sudah mendapatkan banyak jawaban benar, tetapi waktu pengerjaan masih cukup panjang. Ini berarti kamu cukup paham, hanya saja masih terlalu lama menahan diri di beberapa soal.',
        motivation: 'Fokus latihan berikutnya adalah efisiensi. Biasakan selesaikan soal mudah lebih dulu, lalu kembali ke soal yang butuh waktu lebih panjang.'
      }
    },
    high: {
      fast: {
        title: 'Performa sangat kuat dan efisien',
        review: 'Akurasi tinggi dengan waktu cepat menunjukkan penguasaan materi yang sangat baik. Kamu mampu menjaga ketepatan sekaligus ritme pengerjaan.',
        motivation: 'Pertahankan performa ini. Kamu sudah menunjukkan kesiapan yang sangat baik dan tinggal menjaga konsistensinya.'
      },
      steady: {
        title: 'Performa sangat baik dan stabil',
        review: 'Hasilmu sangat kuat dengan tempo yang tetap terkontrol. Ini menandakan kamu teliti, paham pola soal, dan cukup tenang saat mengerjakan.',
        motivation: 'Kamu sudah berada di level yang bagus. Teruskan pola latihan yang sekarang agar kemampuan ini tetap tajam dan konsisten.'
      },
      slow: {
        title: 'Akurasi sangat tinggi, tinggal tingkatkan efisiensi',
        review: 'Ketelitianmu sangat baik dan hasilnya menunjukkan penguasaan materi yang kuat. Waktu pengerjaan masih bisa dipercepat agar performamu jadi lebih lengkap.',
        motivation: 'Fondasi kamu sudah sangat kuat. Sekarang fokus pada manajemen waktu supaya hasil tinggi ini bisa dicapai dengan tempo yang lebih efisien.'
      }
    }
  };

  return {
    scoreLabel,
    timeLabel,
    ...feedbackMap[scoreBand][timeBand]
  };
};

// --- RAW DATA ARRAYS ---
const t2_text = [
  "E x F = BK", "D x D = AB", "G x A = H", "E x B = AE", "D x F = BK",
  "B x B = D", "J x J = HB", "BE x H = AFK", "D x BB = HK", "J x AA = JJ",
  "H x B = AF", "E x J = DE", "AA x C = DD", "G x AA = GG", "G x D = BC",
  "J x D = DF", "F x C = AH", "AH x B = CH", "G x E = CE", "B x G = AD",
  "D x AB = CH", "D x H = DF", "AC x C = CF", "AC x E = FH", "AF x B = DB",
  "H x C = BD", "G x J = FC", "A x AK = AA", "H x E = BK", "C x BE = GK",
  "F x J = ED", "E x BK = BKK", "F x E = EK", "AK x AK = AAK", "AK x G = GG",
  "A x HJ = HJ", "CC x B = FF", "H x J = GB", "GK x C = BAK", "C x C = J",
  "H x H = FD", "AB x C = CF", "AA x AA = AAK", "CE x B = GE", "AK x AH = AHK",
  "H x F = DH", "AB x AK = AAK", "C x GK = CGK", "F x G = DB", "J x C = BG",
  "E x AE = GK", "AB x AB = ADD", "BC x C = FJ", "AE x C = DE", "DK x C = HK",
  "CK x BK = FKK", "D x BE = AKK", "F x AE = JK", "A x K = K", "AK x K = K"
];
const t2_ans = ["s","s","s","s","s","b","s","s","s","b","b","b","s","b","s","s","b","s","b","b","s","s","s","s","s","b","b","s","s","s","b","s","s","s","s","b","b","b","b","b","b","b","s","s","b","b","s","s","b","b","s","b","b","b","s","b","b","b","b","b"];

const t5_text = [
  "B x B = D", "G x A = H", "E x B = AE", "BE x H = AFK", "G x AA = GG",
  "AA x C = DD", "C x C = J", "H x B = AF", "F x G = DB", "E x F = BK",
  "D x F = BK", "F x C = AH", "H x J = GB", "D x BB = HK", "DK x C = HK",
  "A x AK = AA", "H x C = BD", "AH x B = CH", "J x AA = JJ", "E x J = DE",
  "D x D = AB", "H x F = DH", "H x E = BK", "G x D = BC", "G x J = FC",
  "D x H = DF", "F x AE = JK", "F x E = EK", "G x E = CE", "CC x B = FF",
  "B x G = AD", "J x J = HB", "AC x C = CF", "AK x AH = AHK", "AK x AK = AAK",
  "AA x AA = AAK", "E x BK = BKK", "H x H = FD", "A x K = K", "AB x C = CF",
  "AC x E = FH", "AF x B = DB", "A x HJ = HJ", "CE x B = GE", "J x D = DF",
  "C x BE = GK", "GK x C = BAK", "J x C = BG", "AK x G = GG", "D x AB = CH",
  "AB x AK = AAK", "AK x K = K", "F x J = ED", "AE x C = DE", "CK x BK = FKK",
  "E x AE = GK", "AB x AB = ADD", "BC x C = FJ", "C x GK = CGK", "D x BE = AKK"
];
const t5_ans = ["b","s","s","s","b","s","b","b","b","s","s","b","b","s","s","s","b","s","b","b","s","b","s","s","b","s","b","s","b","b","b","s","s","b","s","s","s","b","b","b","s","s","b","s","s","s","b","b","s","s","s","b","b","b","b","s","b","b","s","b"];

// Pembaruan Penjelasan Komplit Tes 03
const t3_data = [
  ["9 - 5 = ...", ["1", "2", "3", "4", "t.a."], "d", "9 - 5 = 4. Opsi d."],
  ["132 : 12 = ...", ["11", "12", "18", "75", "t.a."], "a", "132 : 12 = 11. Opsi a."],
  ["735 - 14 = ...", ["621", "711", "721", "727", "t.a."], "c", "735 - 14 = 721. Opsi c."],
  ["246 : 6 = ...", ["36 5/6", "40", "41", "42", "t.a."], "c", "246 : 6 = 41. Opsi c."],
  ["49 - 27 = ...", ["12", "15", "21", "22", "t.a."], "d", "49 - 27 = 22. Opsi d."],
  ["486 + 24 = ...", ["470", "490", "510", "520", "t.a."], "c", "486 + 24 = 510. Opsi c."],
  ["36 : 4 = ...", ["3", "7", "8", "9", "t.a."], "d", "36 : 4 = 9. Opsi d."],
  ["17 + 18 + 30 = ...", ["55", "57", "59", "63", "t.a."], "e", "17 + 18 + 30 = 65. Jawaban 65 tidak ada pada opsi a-d, sehingga t.a."],
  ["107 - 32 = ...", ["34", "65", "75", "79", "t.a."], "c", "107 - 32 = 75. Opsi c."],
  ["854 x 9 = ...", ["7452", "7546", "7686", "7952", "t.a."], "c", "854 x 9 = 7686. Opsi c."],
  ["1266 + 421 + 353 = ...", ["1960", "2020", "2025", "2040", "t.a."], "d", "1266 + 421 + 353 = 2040. Opsi d."],
  ["2630 x 6 = ...", ["13690", "13980", "14760", "15690", "t.a."], "e", "2630 x 6 = 15780. Jawaban 15780 tidak ada pada opsi a-d, sehingga t.a."],
  ["366 : 6 = ...", ["51", "61", "66", "71", "t.a."], "b", "366 : 6 = 61. Opsi b."],
  ["24 x 32 = ...", ["628", "748", "768", "868", "t.a."], "c", "24 x 32 = 768. Opsi c."],
  ["206 - 34 = ...", ["172", "174", "178", "182", "t.a."], "a", "206 - 34 = 172. Opsi a."],
  ["444 : 6 = ...", ["72", "74", "76", "82", "t.a."], "b", "444 : 6 = 74. Opsi b."],
  ["37 x 6 = ...", ["43", "122", "192", "202", "t.a."], "e", "37 x 6 = 222. Jawaban 222 tidak ada di opsi a-d, sehingga t.a."],
  ["306 : 9 = ...", ["31 1/9", "32", "33", "34", "t.a."], "d", "306 : 9 = 34. Opsi d."],
  ["8306 - 17 = ...", ["7119", "7289", "8189", "8289", "t.a."], "d", "8306 - 17 = 8289. Opsi d."],
  ["63027 : 9 = ...", ["6803 1/9", "6900", "6909 2/9", "7001", "t.a."], "e", "63027 : 9 = 7003. Jawaban 7003 tidak ada di opsi, sehingga t.a."],
  ["947 x 4 = ...", ["3388", "3688", "3768", "3788", "t.a."], "d", "947 x 4 = 3788. Opsi d."],
  ["23 x 42 = ...", ["826", "946", "966", "1066", "t.a."], "c", "23 x 42 = 966. Opsi c."],
  ["6326 x 3 = ...", ["12978", "18968", "18978", "19078", "t.a."], "c", "6326 x 3 = 18978. Opsi c."],
  ["7236 + 8755 + 217 + 323 = ...", ["15471", "16531", "16742", "16951", "t.a."], "b", "7236 + 8755 + 217 + 323 = 16531. Opsi b."],
  ["9208 - 19 = ...", ["9079", "9189", "9218", "9269", "t.a."], "b", "9208 - 19 = 9189. Opsi b."],
  ["30507 + 894 = ...", ["30401", "31301", "31311", "31401", "t.a."], "d", "30507 + 894 = 31401. Opsi d."],
  ["86328 + 1952 + 4070 = ...", ["91340", "91350", "92250", "92340", "t.a."], "e", "86328 + 1952 + 4070 = 92350. Jawaban 92350 tidak ada pada opsi a-d, sehingga t.a."],
  ["2728 - 639 = ...", ["1089", "2089", "2109", "2189", "t.a."], "b", "2728 - 639 = 2089. Opsi b."],
  ["19 + 87 + 1 + 24 + 7 + 54 + 9 = ...", ["191", "201", "210", "221", "t.a."], "b", "Total penjumlahan adalah 201. Opsi b."],
  ["20944 - 967 = ...", ["19977", "19987", "20077", "20977", "t.a."], "a", "20944 - 967 = 19977. Opsi a."],
  ["1750 x 7 = ...", ["11250", "11550", "12050", "12150", "t.a."], "e", "1750 x 7 = 12250. Tidak ada di opsi a-d, sehingga t.a."],
  ["2024856 - 683387 = ...", ["1340469", "1341269", "1341369", "1341469", "t.a."], "d", "2024856 - 683387 = 1341469. Opsi d."],
  ["90264 x 8 = ...", ["721112", "722092", "722112", "722122", "t.a."], "c", "90264 x 8 = 722112. Opsi c."],
  ["13845 x 40 = ...", ["55380", "553700", "553800", "554800", "t.a."], "c", "13845 x 40 = 553800. Opsi c."],
  ["80124 : 6 = ...", ["13254", "13347", "13354", "13396", "t.a."], "c", "80124 : 6 = 13354. Opsi c."],
  ["102653+4342+962384+5729+43703 = ...", ["1118811", "1118821", "1118861", "1118911", "t.a."], "a", "Total penjumlahannya = 1118811. Opsi a."],
  ["70600 - 1392 = ...", ["69208", "69128", "69308", "70208", "t.a."], "a", "70600 - 1392 = 69208. Opsi a."],
  ["81036 : 9 = ...", ["904", "9004", "9040", "9050", "t.a."], "b", "81036 : 9 = 9004. Opsi b."],
  ["960400 : 80 = ...", ["1205", "1215", "1250", "12004", "t.a."], "e", "960400 : 80 = 12005. Jawaban 12005 tidak ada pada opsi a-d, sehingga t.a."],
  ["736032 : 8 = ...", ["9204", "90903", "91094", "92004", "t.a."], "d", "736032 : 8 = 92004. Opsi d."]
];

const t4_data = [
  ["Seorang pemborong dapat membangun 6 rumah dalam 1 bulan. Berapa dapat dibangunnya dalam 8 bulan?", ["14 rumah", "45 rumah", "48 rumah", "49 rumah", "t.a."], "c", "6 x 8 = 48 rumah."],
  ["Berapa jumlah murid suatu kelas dengan 12 anak perempuan dan 7 anak laki-laki?", ["5 murid", "15 murid", "17 murid", "18 murid", "t.a."], "e", "12 + 7 = 19 murid. Opsi tidak ada (t.a)."],
  ["Dengan 1 liter bensin Saleh dapat menempuh jarak 14 km dengan mobilnya. Berapa km dapat ditempuhnya dengan 15 liter?", ["110 km", "210 km", "211 km", "219 km", "t.a."], "b", "15 liter x 14 km = 210 km."],
  ["Widodo biasanya memerlukan waktu 45 menit untuk pergi kekantor. Pagi ini ia membutuhkan waktu 1 jam 5 menit. Jadi berapa tambahan waktu telah dipergunakannya?", ["5 menit", "10 menit", "20 menit", "30 menit", "t.a."], "c", "1 jam 5 menit = 65 menit. 65 - 45 = 20 menit."],
  ["Sigit telah membeli sepasang sepatu seharga Rp. 3960,- Ia bermaksud akan melunasinya waktu 1 tahun. Berapa harus dibayarnya setiap bulannya?", ["Rp. 305,-", "Rp. 325,50", "Rp. 330,-", "Rp. 342,75", "t.a."], "c", "1 tahun = 12 bulan. Rp. 3960 / 12 = Rp. 330,-."],
  ["Seorang anak perempuan yang berumur 14 tahun menjalani 1/2 dari hidupnya di Medan. Berapa lama ia berdiam di Medan?", ["4 3/4 tahun", "5 tahun", "5 1/2 tahun", "11 tahun", "t.a."], "e", "1/2 dari 14 tahun = 7 tahun. Jawaban (t.a)."],
  ["Sebuah toko mempunyai pegawai 3 kali lebih banyak daripada tahun yang lalu. Tahun yang lalu pegawainya 29 orang. Berapakah sekarang pegawainya?", ["87 orang", "91 orang", "97 orang", "98 orang", "t.a."], "a", "3 x 29 orang = 87 orang."],
  ["Berapa meter persegi permadani dibutuhkan untuk menutupi lantai yang panjangnya 27 meter dan lebarnya 15 meter?", ["12 m²", "42 m²", "395 m²", "405 m²", "t.a."], "d", "Luas = 27 m x 15 m = 405 m²."],
  ["Dalam sebuah rapat ketua memberikan kesempatan 15 menit kepada setiap pembicara untuk mengemukakan pendapatnya. Rapat berlangsung selama 3/4 jam. Berapa orang mendapat kesempatan untuk berbicara?", ["12 orang", "14 orang", "16 orang", "18 orang", "t.a."], "e", "3/4 jam = 45 menit. 45 / 15 = 3 orang. Opsi tidak ada (t.a)."],
  ["3 orang anak telah membagikan diantara mereka uang sebesar Rp. 36,-. Anak 1 mendapat bagian 1/4 dari jumlah seluruhnya dan anak 2 mendapat bagian 1/5 dari jumlah seluruhnya. Berapa rupiah diterima oleh anak 3?", ["Rp. 10,-", "Rp. 12,50", "Rp. 15,-", "Rp. 20,-", "t.a."], "e", "1/4 = 9, 1/5 = 7.2. Anak ke-3 mendapat sisanya yaitu 19,8. Opsi t.a."],
  ["Kasmono telah menempuh jarak 1275 km. 40% dari jarak ini ditempuhnya dengan pesawat terbang. Berapa km-kah telah ditempuhnya dengan pesawat tersebut?", ["3132 km", "510 km", "765 km", "1235 km", "t.a."], "b", "40% dari 1275 = (40/100) x 1275 = 510 km."],
  ["Dalam waktu 3 bulan Gito dapat membuat sebuah radio. Berapa jumlah radio yang paling banyak dapat dibuatnya dalam waktu 2 3/4 tahun?", ["9 radio", "11 radio", "14 radio", "21 radio", "t.a."], "b", "2 3/4 tahun = 33 bulan. 33 / 3 = 11 radio."],
  ["Suroto telah membeli sebuah sepeda motor seharga Rp. 312 500,-. Pada waktu dijualnya ia rugi Rp. 41 075,-. Berapakah harga penjualan?", ["Rp. 269 425,-", "Rp. 270 425,-", "Rp. 271 425,-", "Rp. 271 525,-", "t.a."], "c", "312.500 - 41.075 = Rp. 271.425,-."],
  ["Dua lingkaran mempunyai garis-tengah 2,6 cm dan 1,855 cm. Berapakah beda kedua garis-tengah itu?", ["0,745 cm", "0,775 cm", "0,825 cm", "0,855 cm", "t.a."], "a", "2,6 - 1,855 = 0,745 cm."],
  ["Sebuah mesin menggerakkan sebuah roda besar dan sebuah roda kecil. Roda yang besar membuat 12 perputaran apabila yang kecil membuat 32 perputaran. Berapa perputaran akan dibuat oleh roda yang kecil, apabila yang besar membuat 72 perputaran?", ["2 1/4 perputaran", "6 perputaran", "192 perputaran", "212 perputaran", "t.a."], "c", "Perbandingan = 72 / 12 = 6. Maka 6 x 32 = 192 perputaran."],
  ["Pranoto biasanya bekerja 45 jam seminggu. Minggu yang lalu ia melembur selama 17 jam. Berapa jamkah ia bekerja?", ["28 jam", "38 jam", "52 jam", "61 jam", "t.a."], "e", "45 jam + 17 jam = 62 jam. Jawaban (t.a)."],
  ["Seseorang memiliki sebuah rumah seharga Rp. 900 000,- Untuk keperluan pajak, harga rumah ditaksir sebesar 2/3 dari harga seluruhnya. Pajaknya ialah sebesar Rp. 2,25 setiap Rp. 10 000,- dari harga taksiran. Berapa pajak yang harus dibayar orang itu?", ["Rp. 135,-", "Rp. 150,-", "Rp. 270,-", "Rp. 875,25", "t.a."], "a", "Taksiran = 2/3 x 900.000 = 600.000. Pajak = (600.000 / 10.000) x 2,25 = 60 x 2,25 = Rp. 135,-."],
  ["Dalam suatu ujian Bambang harus menjawab 60 pertanyaan. 51 pertanyaan dijawabnya dengan benar. Berapa persen dari semua pertanyaan telah dijawabnya dengan benar?", ["15%", "18%", "75%", "85%", "t.a."], "d", "(51 / 60) x 100% = 85%."],
  ["Pada sebuah kantor bekerja 12 juru-tik dimana setiap orang mengetik 12 halaman setiap hari. Disamping itu juga 15 juru-tik yang masing-masing mengetik 20 halaman sehari dan 20 juru-tik yang masing-masing mengetik 18 halaman setiap hari. Berapa halaman seluruhnya dapat diketik dalam 5 hari?", ["1680 halaman", "4020 halaman", "4220 halaman", "4225 halaman", "t.a."], "b", "Per hari: (12x12)+(15x20)+(20x18) = 144 + 300 + 360 = 804. Dalam 5 hari: 804 x 5 = 4020 halaman."],
  ["Seorang telah membeli 2 kg ubi seharga Rp. 43,56 tiap kg. Selain itu ia membeli pula gula pasir seharga Rp. 27,69. Berapakah harga seluruhnya?", ["Rp. 12,57", "Rp. 124,70", "Rp. 125,20", "Rp. 125,70", "t.a."], "e", "2 x 43,56 = 87,12. 87,12 + 27,69 = 114,81. Opsi (t.a)."],
  ["Seorang anak tinggal sejauh 2 km dari sekolah. Ia naik sepeda dengan kecepatan 10 km sejam. Berapakah waktu yang dibutuhkan setiap minggu untuk pulang-pergi ke sekolah? (Hanya 5 hari seminggu ia bersekolah).", ["2 jam", "2 1/2 jam", "3 jam", "4 jam", "t.a."], "a", "Sehari PP = 4 km. Seminggu (5 hari) = 20 km. Waktu = 20 km / 10 km/jam = 2 jam."],
  ["Sebuah perusahaan tambang minyak bertujuan membor sebuah sumur. Perusahaan itu membayar Rp. 250,- setiap meter untuk 25 meter pertama, Rp. 300,- setiap meter untuk 50 meter berikutnya dan Rp. 350,- setiap meter untuk selanjutnya. Apabila seluruh pemboran telah menelan biaya Rp. 36 300,-, berapa dalamnya sumur tersebut?", ["113 meter", "115 meter", "118 meter", "125 meter", "t.a."], "c", "Biaya 25 meter pertama = 25 x 250 = Rp. 6.250,-. Biaya 50 meter berikutnya = 50 x 300 = Rp. 15.000,-. Total 75 meter pertama = Rp. 21.250,-. Sisa biaya = Rp. 36.300,- - Rp. 21.250,- = Rp. 15.050,-. Dengan tarif Rp. 350,- per meter, sisa kedalaman = 15.050 / 350 = 43 meter. Total kedalaman = 75 + 43 = 118 meter. Opsi c."]
];

const t6a_data = [
  ["14 + 6 × 3 = ...", ["30", "32", "34", "28", "36"], "b", "Dahulukan perkalian: 6 × 3 = 18. Kemudian 14 + 18 = 32. Opsi b."],
  ["96 : 8 + 7 = ...", ["17", "18", "20", "21", "19"], "e", "96 : 8 = 12. Kemudian 12 + 7 = 19. Opsi e."],
  ["45 - 18 + 9 = ...", ["35", "36", "34", "37", "38"], "b", "Kerjakan dari kiri: 45 - 18 = 27. Kemudian 27 + 9 = 36. Opsi b."],
  ["11 × 4 - 13 = ...", ["29", "30", "33", "31", "32"], "d", "Dahulukan perkalian: 11 × 4 = 44. Kemudian 44 - 13 = 31. Opsi d."],
  ["72 : 9 + 16 = ...", ["23", "25", "24", "22", "26"], "c", "72 : 9 = 8. Kemudian 8 + 16 = 24. Opsi c."],
  ["7 × 6 - 19 = ...", ["23", "21", "24", "22", "19"], "a", "Dahulukan perkalian: 7 × 6 = 42. Kemudian 42 - 19 = 23. Opsi a."],
  ["27 + 15 - 8 = ...", ["32", "35", "36", "33", "34"], "e", "Kerjakan dari kiri: 27 + 15 = 42. Kemudian 42 - 8 = 34. Opsi e."],
  ["144 : 12 + 5 = ...", ["18", "16", "17", "15", "19"], "c", "144 : 12 = 12. Kemudian 12 + 5 = 17. Opsi c."],
  ["9 × 8 + 6 = ...", ["80", "78", "74", "76", "82"], "b", "Dahulukan perkalian: 9 × 8 = 72. Kemudian 72 + 6 = 78. Opsi b."],
  ["63 - 27 : 3 = ...", ["55", "56", "54", "53", "52"], "c", "Dahulukan pembagian: 27 : 3 = 9. Kemudian 63 - 9 = 54. Opsi c."],
  ["18 + 4 × 7 = ...", ["44", "42", "46", "48", "50"], "c", "Dahulukan perkalian: 4 × 7 = 28. Kemudian 18 + 28 = 46. Opsi c."],
  ["150 : 5 - 11 = ...", ["20", "21", "17", "19", "18"], "d", "150 : 5 = 30. Kemudian 30 - 11 = 19. Opsi d."],
  ["32 + 48 : 6 = ...", ["39", "40", "42", "38", "41"], "b", "48 : 6 = 8. Kemudian 32 + 8 = 40. Opsi b."],
  ["5 × 15 - 28 = ...", ["47", "45", "48", "46", "49"], "a", "Dahulukan perkalian: 5 × 15 = 75. Kemudian 75 - 28 = 47. Opsi a."],
  ["81 : 9 + 27 = ...", ["34", "37", "35", "38", "36"], "e", "81 : 9 = 9. Kemudian 9 + 27 = 36. Opsi e."],
  ["66 - 14 + 5 = ...", ["58", "57", "59", "56", "55"], "b", "Kerjakan dari kiri: 66 - 14 = 52. Kemudian 52 + 5 = 57. Opsi b."],
  ["13 × 3 + 22 = ...", ["63", "60", "62", "61", "59"], "d", "Dahulukan perkalian: 13 × 3 = 39. Kemudian 39 + 22 = 61. Opsi d."],
  ["108 : 6 - 7 = ...", ["9", "10", "12", "13", "11"], "e", "108 : 6 = 18. Kemudian 18 - 7 = 11. Opsi e."],
  ["24 + 9 × 5 = ...", ["69", "67", "70", "71", "68"], "a", "Dahulukan perkalian: 9 × 5 = 45. Kemudian 24 + 45 = 69. Opsi a."],
  ["84 : 7 + 18 = ...", ["31", "29", "28", "30", "32"], "d", "84 : 7 = 12. Kemudian 12 + 18 = 30. Opsi d."]
];

const t6b_text = [
  "A x J = J", "B x E = AK", "C x G = BA", "D x F = BD", "E x H = DK",
  "F x J = EB", "G x H = EF", "H x H = FC", "J x J = HA", "AB x C = CE",
  "AK x E = EK", "AJ x B = CH", "AC x D = EB", "AE x C = DD", "AF x B = BC",
  "AH x B = CF", "BB x D = HH", "BE x F = AEK", "BK x C = EK", "HJ x A = HJ"
];
const t6b_ans = ["b","b","b","b","b","s","b","s","b","s","b","b","b","s","b","b","b","b","s","b"];

const t6c_data = [
  ["Farah dapat menyusun 18 map dalam 3 jam. Berapa map dapat disusunnya dalam 7 jam?", ["36 map", "42 map", "40 map", "48 map", "t.a."], "b", "Dalam 1 jam Farah menyusun 18 / 3 = 6 map. Dalam 7 jam ia menyusun 7 × 6 = 42 map. Opsi b."],
  ["Reno membeli 5 buku masing-masing Rp. 12.400,- dan 2 pensil masing-masing Rp. 3.500,-. Berapakah jumlah seluruh belanja Reno?", ["Rp. 68.000,-", "Rp. 69.500,-", "Rp. 70.000,-", "Rp. 69.000,-", "t.a."], "d", "5 × 12.400 = 62.000. 2 × 3.500 = 7.000. Total = 69.000. Opsi d."],
  ["Laras menabung Rp. 15.000,- setiap minggu selama 8 minggu. Setelah itu ia mengambil Rp. 20.000,-. Berapa sisa tabungannya?", ["Rp. 95.000,-", "Rp. 100.000,-", "Rp. 105.000,-", "Rp. 90.000,-", "t.a."], "b", "Tabungan awal = 8 × 15.000 = 120.000. Setelah diambil 20.000, sisanya 100.000. Opsi b."],
  ["Dalam satu kotak terdapat 24 botol minum. Berapa botol terdapat dalam 15 kotak?", ["340 botol", "320 botol", "380 botol", "360 botol", "t.a."], "d", "24 × 15 = 360 botol. Opsi d."],
  ["Bimo menempuh jarak 180 km dalam 3 jam. Jika kecepatannya tetap, berapa km yang ditempuh dalam 5 jam?", ["300 km", "280 km", "320 km", "290 km", "t.a."], "a", "Kecepatan Bimo = 180 / 3 = 60 km/jam. Dalam 5 jam jaraknya 60 × 5 = 300 km. Opsi a."],
  ["Santi berumur 16 tahun. Adiknya 3 tahun lebih muda. Berapa jumlah umur mereka sekarang?", ["27 tahun", "28 tahun", "29 tahun", "30 tahun", "t.a."], "c", "Umur adik = 16 - 3 = 13 tahun. Jumlah umur mereka = 16 + 13 = 29 tahun. Opsi c."],
  ["Pak Yusuf membeli 12 kg beras dengan harga Rp. 14.500,- per kg. Ia membayar dengan Rp. 200.000,-. Berapakah uang kembaliannya?", ["Rp. 25.000,-", "Rp. 26.000,-", "Rp. 24.000,-", "Rp. 27.000,-", "t.a."], "b", "Total harga = 12 × 14.500 = 174.000. Kembalian = 200.000 - 174.000 = 26.000. Opsi b."],
  ["Sebuah bus berangkat pukul 07.35 dan tiba pukul 10.20. Berapa lama perjalanan bus tersebut?", ["2 jam 35 menit", "2 jam 55 menit", "2 jam 45 menit", "2 jam 25 menit", "t.a."], "c", "Dari 07.35 ke 10.20 selisih waktunya 2 jam 45 menit. Opsi c."],
  ["Dalam sebuah latihan, Nisa menjawab 45 dari 60 soal dengan benar. Berapa persen jawaban benar Nisa?", ["70%", "75%", "80%", "65%", "t.a."], "b", "(45 / 60) × 100% = 75%. Opsi b."],
  ["Perusahaan membayar Rp. 4.500,- per paket untuk 18 paket pertama dan Rp. 5.000,- per paket untuk sisanya. Jika Seno menyelesaikan 24 paket, berapa total upah yang diterimanya?", ["Rp. 108.000,-", "Rp. 114.000,-", "Rp. 111.000,-", "Rp. 106.000,-", "t.a."], "c", "18 paket pertama = 18 × 4.500 = 81.000. Sisa 6 paket = 6 × 5.000 = 30.000. Total = 111.000. Opsi c."]
];

const t6_letterNote = "A = 1, B = 2, C = 3, D = 4, E = 5, F = 6, G = 7, H = 8, J = 9, K = 0";
const t6_questions = [
  ...buildMC(t6a_data, 1),
  ...buildTF(t6b_text, t6b_ans, 21).map((q) => ({ ...q, note: t6_letterNote })),
  ...buildMC(t6c_data, 41)
];


const TEST_DATA = {
  1: {
    title: "TES NUMERIK 01",
    description: "Test berikut ini terdiri atas soal-soal berhitung.",
    instructions: "Test berikut ini terdiri atas soal-soal berhitung..\n\nSetiap soal disertai dengan lima kemungkinan jawaban a, b, c, d dan e.\n\nSalah satu diantaranya adalah jawaban yang benar dari soal tersebut. Cara menjawabnya adalah dengan melingkari pada lembar jawaban dibelakang nomor soal, huruf yang sesuai dengan jawaban yang benar dari soal itu.",
    examples: [
      {
        text: "1) 28 + 13 - 9 = ...",
        options: ["a. 24", "b. 22", "c. 33", "d. 32", "e. 23"],
        explanation: "Pada contoh 1 jawaban yang benar adalah 32, dengan demikian huruf d pada lembar jawaban dibelakang contoh 1 sudah dilingkari."
      },
      {
        text: "2) 32 : 4 - 3 = ...",
        options: ["a. 4", "b. 5", "c. 2", "d. 3", "e. 6"],
        explanation: "Jawaban contoh 2 adalah 5, oleh karena itu huruf b pada lembar jawaban dibelakang contoh 2 telah dilingkari."
      },
      {
        intro: "Coba pecahkan sendiri contoh-contoh dibawah ini, dan lingkarilah pada lembar jawaban dibelakang nomor contoh, huruf yang sesuai dengan jawaban yang benar.",
        text: "3) 36 : 4 - 2 = ...",
        options: ["a. 6", "b. 7", "c. 8", "d. 5", "e. 9"],
        explanation: "Jawaban contoh 3 adalah 7. Oleh karena itu huruf b pada lembar jawaban dibelakang contoh 3 harus dilingkari."
      },
      {
        text: "4) 16 × 3 : 12 = ...",
        options: ["a. 4", "b. 3", "c. 6", "d. 5", "e. 2"],
        explanation: "Jawaban contoh 4 adalah 4. Oleh karena itu huruf a pada lembar jawaban harus dilingkari."
      }
    ],
    closingInstruction: "Jika perlu, perhitungan-perhitungan dapat dilakukan pada kertas buram yang tersedia.",
    questions: [
      {
        id: 't1q1',
        text: "1) 2 × 8 + 7 = ...",
        options: [
          { id: 'a', text: '33' }, { id: 'b', text: '27' }, { id: 'c', text: '21' }, { id: 'd', text: '23' }, { id: 'e', text: '31' }
        ],
        correctAnswer: 'd',
        explanation: "Dahulukan perkalian: 2 × 8 = 16. Kemudian 16 + 7 = 23."
      },
      {
        id: 't1q2',
        text: "2) 7 × 3 - 16 = ...",
        options: [
          { id: 'a', text: '15' }, { id: 'b', text: '8' }, { id: 'c', text: '4' }, { id: 'd', text: '9' }, { id: 'e', text: '5' }
        ],
        correctAnswer: 'e',
        explanation: "Dahulukan perkalian: 7 × 3 = 21. Kemudian 21 - 16 = 5."
      },
      {
        id: 't1q3',
        text: "3) 16 + 3 - 7 = ...",
        options: [
          { id: 'a', text: '8' }, { id: 'b', text: '10' }, { id: 'c', text: '14' }, { id: 'd', text: '6' }, { id: 'e', text: '12' }
        ],
        correctAnswer: 'e',
        explanation: "16 + 3 = 19. Kemudian 19 - 7 = 12."
      },
      {
        id: 't1q4',
        text: "4) 3 × 9 : 3 = ...",
        options: [
          { id: 'a', text: '13' }, { id: 'b', text: '12' }, { id: 'c', text: '6' }, { id: 'd', text: '9' }, { id: 'e', text: '8' }
        ],
        correctAnswer: 'd',
        explanation: "Dahulukan perkalian/pembagian dari kiri: 3 × 9 = 27. Kemudian 27 : 3 = 9."
      },
      {
        id: 't1q5',
        text: "5) 24 + 64 : 4 = ...",
        options: [
          { id: 'a', text: '40' }, { id: 'b', text: '39' }, { id: 'c', text: '52' }, { id: 'd', text: '45' }, { id: 'e', text: '24' }
        ],
        correctAnswer: 'a',
        explanation: "Dahulukan pembagian: 64 : 4 = 16. Kemudian 24 + 16 = 40."
      },
      {
        id: 't1q6',
        text: "6) 18 + 3 + 24 = ...",
        options: [
          { id: 'a', text: '35' }, { id: 'b', text: '38' }, { id: 'c', text: '43' }, { id: 'd', text: '45' }, { id: 'e', text: '48' }
        ],
        correctAnswer: 'd',
        explanation: "Dijumlahkan berurutan: 18 + 3 = 21. Kemudian 21 + 24 = 45."
      },
      {
        id: 't1q7',
        text: "7) 5 × 12 - 17 = ...",
        options: [
          { id: 'a', text: '43' }, { id: 'b', text: '33' }, { id: 'c', text: '73' }, { id: 'd', text: '53' }, { id: 'e', text: '34' }
        ],
        correctAnswer: 'a',
        explanation: "Dahulukan perkalian: 5 × 12 = 60. Kemudian 60 - 17 = 43."
      },
      {
        id: 't1q8',
        text: "8) 6 × 3 : 2 = ...",
        options: [
          { id: 'a', text: '4' }, { id: 'b', text: '8' }, { id: 'c', text: '9' }, { id: 'd', text: '12' }, { id: 'e', text: '10' }
        ],
        correctAnswer: 'c',
        explanation: "Dahulukan dari kiri: 6 × 3 = 18. Kemudian 18 : 2 = 9."
      },
      {
        id: 't1q9',
        text: "9) 56 - 11 + 4 = ...",
        options: [
          { id: 'a', text: '49' }, { id: 'b', text: '42' }, { id: 'c', text: '39' }, { id: 'd', text: '37' }, { id: 'e', text: '47' }
        ],
        correctAnswer: 'a',
        explanation: "Kerjakan dari kiri: 56 - 11 = 45. Kemudian 45 + 4 = 49."
      },
      {
        id: 't1q10',
        text: "10) 8 × 3 × 4 = ...",
        options: [
          { id: 'a', text: '94' }, { id: 'b', text: '96' }, { id: 'c', text: '86' }, { id: 'd', text: '84' }, { id: 'e', text: '98' }
        ],
        correctAnswer: 'b',
        explanation: "Kalikan berurutan: 8 × 3 = 24. Kemudian 24 × 4 = 96."
      },
      {
        id: 't1q11',
        text: "11) 42 : 3 - 7 = ...",
        options: [
          { id: 'a', text: '9' }, { id: 'b', text: '7' }, { id: 'c', text: '6' }, { id: 'd', text: '12' }, { id: 'e', text: '14' }
        ],
        correctAnswer: 'b',
        explanation: "Dahulukan pembagian: 42 : 3 = 14. Kemudian 14 - 7 = 7."
      },
      {
        id: 't1q12',
        text: "12) 54 : 9 - 2 = ...",
        options: [
          { id: 'a', text: '13' }, { id: 'b', text: '6' }, { id: 'c', text: '15' }, { id: 'd', text: '2' }, { id: 'e', text: '4' }
        ],
        correctAnswer: 'e',
        explanation: "Dahulukan pembagian: 54 : 9 = 6. Kemudian 6 - 2 = 4."
      },
      {
        id: 't1q13',
        text: "13) 9 × 7 + 13 = ...",
        options: [
          { id: 'a', text: '64' }, { id: 'b', text: '78' }, { id: 'c', text: '76' }, { id: 'd', text: '77' }, { id: 'e', text: '68' }
        ],
        correctAnswer: 'c',
        explanation: "Dahulukan perkalian: 9 × 7 = 63. Kemudian 63 + 13 = 76."
      },
      {
        id: 't1q14',
        text: "14) 2 × 32 : 16 = ...",
        options: [
          { id: 'a', text: '2' }, { id: 'b', text: '1' }, { id: 'c', text: '4' }, { id: 'd', text: '6' }, { id: 'e', text: '3' }
        ],
        correctAnswer: 'c',
        explanation: "Kerjakan dari kiri: 2 × 32 = 64. Kemudian 64 : 16 = 4."
      },
      {
        id: 't1q15',
        text: "15) 45 - 13 - 12 = ...",
        options: [
          { id: 'a', text: '22' }, { id: 'b', text: '23' }, { id: 'c', text: '18' }, { id: 'd', text: '19' }, { id: 'e', text: '20' }
        ],
        correctAnswer: 'e',
        explanation: "Kurangkan berurutan: 45 - 13 = 32. Kemudian 32 - 12 = 20."
      },
      {
        id: 't1q16',
        text: "16) 4 × 13 + 6 = ...",
        options: [
          { id: 'a', text: '46' }, { id: 'b', text: '52' }, { id: 'c', text: '58' }, { id: 'd', text: '48' }, { id: 'e', text: '56' }
        ],
        correctAnswer: 'c',
        explanation: "Dahulukan perkalian: 4 × 13 = 52. Kemudian 52 + 6 = 58."
      },
      {
        id: 't1q17',
        text: "17) 121 : 11 + 11 = ...",
        options: [
          { id: 'a', text: '11' }, { id: 'b', text: '23' }, { id: 'c', text: '33' }, { id: 'd', text: '21' }, { id: 'e', text: '22' }
        ],
        correctAnswer: 'e',
        explanation: "Dahulukan pembagian: 121 : 11 = 11. Kemudian 11 + 11 = 22."
      },
      {
        id: 't1q18',
        text: "18) 7 + 8 × 6 = ...",
        options: [
          { id: 'a', text: '54' }, { id: 'b', text: '56' }, { id: 'c', text: '45' }, { id: 'd', text: '55' }, { id: 'e', text: '65' }
        ],
        correctAnswer: 'd',
        explanation: "Dahulukan perkalian: 8 × 6 = 48. Kemudian 7 + 48 = 55."
      },
      {
        id: 't1q19',
        text: "19) 7 × 9 + 9 = ...",
        options: [
          { id: 'a', text: '69' }, { id: 'b', text: '72' }, { id: 'c', text: '96' }, { id: 'd', text: '62' }, { id: 'e', text: '71' }
        ],
        correctAnswer: 'b',
        explanation: "Dahulukan perkalian: 7 × 9 = 63. Kemudian 63 + 9 = 72."
      },
      {
        id: 't1q20',
        text: "20) 47 - 13 - 2 = ...",
        options: [
          { id: 'a', text: '27' }, { id: 'b', text: '32' }, { id: 'c', text: '28' }, { id: 'd', text: '34' }, { id: 'e', text: '25' }
        ],
        correctAnswer: 'b',
        explanation: "Kurangkan berurutan: 47 - 13 = 34. Kemudian 34 - 2 = 32."
      },
      {
        id: 't1q21',
        text: "21) 95 : 5 - 1 = ...",
        options: [
          { id: 'a', text: '28' }, { id: 'b', text: '17' }, { id: 'c', text: '18' }, { id: 'd', text: '26' }, { id: 'e', text: '19' }
        ],
        correctAnswer: 'c',
        explanation: "Dahulukan pembagian: 95 : 5 = 19. Kemudian 19 - 1 = 18."
      },
      {
        id: 't1q22',
        text: "22) 11 × 3 - 9 = ...",
        options: [
          { id: 'a', text: '24' }, { id: 'b', text: '21' }, { id: 'c', text: '23' }, { id: 'd', text: '19' }, { id: 'e', text: '26' }
        ],
        correctAnswer: 'a',
        explanation: "Dahulukan perkalian: 11 × 3 = 33. Kemudian 33 - 9 = 24."
      },
      {
        id: 't1q23',
        text: "23) 16 + 9 + 14 = ...",
        options: [
          { id: 'a', text: '29' }, { id: 'b', text: '38' }, { id: 'c', text: '40' }, { id: 'd', text: '28' }, { id: 'e', text: '39' }
        ],
        correctAnswer: 'e',
        explanation: "Jumlahkan berurutan: 16 + 9 = 25. Kemudian 25 + 14 = 39."
      },
      {
        id: 't1q24',
        text: "24) 28 + 17 - 5 = ...",
        options: [
          { id: 'a', text: '41' }, { id: 'b', text: '39' }, { id: 'c', text: '40' }, { id: 'd', text: '38' }, { id: 'e', text: '30' }
        ],
        correctAnswer: 'c',
        explanation: "Kerjakan dari kiri: 28 + 17 = 45. Kemudian 45 - 5 = 40."
      },
      {
        id: 't1q25',
        text: "25) 4 × 13 - 9 = ...",
        options: [
          { id: 'a', text: '33' }, { id: 'b', text: '43' }, { id: 'c', text: '28' }, { id: 'd', text: '46' }, { id: 'e', text: '32' }
        ],
        correctAnswer: 'b',
        explanation: "Dahulukan perkalian: 4 × 13 = 52. Kemudian 52 - 9 = 43."
      },
      {
        id: 't1q26',
        text: "26) 48 : 4 - 2 = ...",
        options: [
          { id: 'a', text: '8' }, { id: 'b', text: '12' }, { id: 'c', text: '14' }, { id: 'd', text: '10' }, { id: 'e', text: '6' }
        ],
        correctAnswer: 'd',
        explanation: "Dahulukan pembagian: 48 : 4 = 12. Kemudian 12 - 2 = 10."
      },
      {
        id: 't1q27',
        text: "27) 23 + 14 - 5 = ...",
        options: [
          { id: 'a', text: '32' }, { id: 'b', text: '28' }, { id: 'c', text: '23' }, { id: 'd', text: '34' }, { id: 'e', text: '35' }
        ],
        correctAnswer: 'a',
        explanation: "Kerjakan dari kiri: 23 + 14 = 37. Kemudian 37 - 5 = 32."
      },
      {
        id: 't1q28',
        text: "28) 7 × 8 - 20 = ...",
        options: [
          { id: 'a', text: '36' }, { id: 'b', text: '34' }, { id: 'c', text: '33' }, { id: 'd', text: '26' }, { id: 'e', text: '25' }
        ],
        correctAnswer: 'a',
        explanation: "Dahulukan perkalian: 7 × 8 = 56. Kemudian 56 - 20 = 36."
      },
      {
        id: 't1q29',
        text: "29) 9 × 9 + 11 = ...",
        options: [
          { id: 'a', text: '92' }, { id: 'b', text: '93' }, { id: 'c', text: '100' }, { id: 'd', text: '102' }, { id: 'e', text: '83' }
        ],
        correctAnswer: 'a',
        explanation: "Dahulukan perkalian: 9 × 9 = 81. Kemudian 81 + 11 = 92."
      },
      {
        id: 't1q30',
        text: "30) 6 + 84 : 6 = ...",
        options: [
          { id: 'a', text: '12' }, { id: 'b', text: '18' }, { id: 'c', text: '22' }, { id: 'd', text: '20' }, { id: 'e', text: '19' }
        ],
        correctAnswer: 'd',
        explanation: "Dahulukan pembagian: 84 : 6 = 14. Kemudian 6 + 14 = 20."
      }
    ]
  },
  2: {
    title: "TES NUMERIK 02",
    description: "Test ini terdiri dari soal-soal berhitung dengan menggunakan huruf-huruf.",
    instructions: "Test ini terdiri dari soal-soal berhitung dengan menggunakan huruf-huruf.\nTentang menghitung perkalian, misalnya 5 x 12 = ..., kiranya tidak perlu\ndijelaskan lagi.\nTetapi dalam test ini, soal-soalnya tidak terdiri dari angka-angka (bilangan-\nbilangan), melainkan huruf-huruf.\n\nDiketahui:\nA = 1, B = 2, C = 3, D = 4, E = 5, F = 6, G = 7, H = 8, J = 9, K = 0\n\nHuruf AB misalnya adalah angka 1 dan 2 berurutan, dan itu berarti sama dengan\n12. Diketahui bahwa A = 1 dan F = 6; dengan demikian AF = 16.\nPerhatikan contoh-contoh dibawah ini:",
    examples: [
      {
        text: "1) A x C = C",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Pada contoh 1, A x C = 1 x 3 dan hasilnya sama dengan 3. Angka 3 dapat diganti dengan huruf C. Dengan demikian perhitungan contoh 1 adalah benar. Oleh karena itu pada lembar jawaban dibelakang contoh 1, huruf b (= benar) telah dilingkari."
      },
      {
        text: "2) C x F = AE",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Pada contoh 2, C x F dapat diganti dengan 3 x 6 yang akan memberikan hasil sama dengan 18. Angka 18 dapat diganti dengan huruf AH. Pada contoh 2 kita lihat bahwa C x F = AE, dengan demikian berarti bahwa hasil perhitungan itu salah, sebab seharusnya AH dan bukannya AE. Oleh karena itu pada lembar jawaban dibelakang contoh 2, huruf s (= salah) telah dilingkari."
      },
      {
        text: "3) G x H = EF",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Pada contoh 3, G x H = 7 x 8; hasilnya = 56 atau = EF. Dengan demikian contoh 3 adalah benar. Oleh karena itu pada lembar jawaban, huruf b telah dilingkari."
      },
      {
        text: "4) K x B = K",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Pada contoh 4, K x B = 0 x 2; hasilnya = 0 atau = K. Jadi contoh 4 adalah benar."
      },
      {
        intro: "Dibawah ini masih terdapat 4 contoh. Kerjakan sendiri contoh-contoh tersebut.",
        text: "5) B x J = AD",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Jawaban contoh 5 adalah s (salah)."
      },
      {
        text: "6) J x D = BF",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Jawaban contoh 6 adalah s (salah)."
      },
      {
        text: "7) AB x C = CF",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Jawaban contoh 7 adalah b (benar)."
      },
      {
        text: "8) AK x AK = BKK",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "Jawaban yang benar dari contoh-contoh diatas adalah: contoh 5 = s; contoh 6 = s; contoh 7 = b; contoh 8 = s."
      }
    ],
    closingInstruction: "Jika perlu, perhitungan-perhitungan dapat dilakukan pada kertas buram yang tersedia.",
    note: "A = 1, B = 2, C = 3, D = 4, E = 5, F = 6, G = 7, H = 8, J = 9, K = 0",
    questions: buildTF(t2_text, t2_ans)
  },
  3: {
    title: "TES NUMERIK 03",
    description: "Tes berhitung dengan opsi Tidak Ada (t.a).",
    instructions: "Test berikut ini terdiri atas soal-soal berhitung.\nSetiap soal disertai dengan lima kemungkinan jawaban a, b, c, d dan e.\nSalah satu diantaranya adalah jawaban dari soal tersebut.\nMaksud kemungkinan jawaban yang kelima atau e yaitu t.a., adalah bahwa\njawaban dari soal yang bersangkutan tidak terdapat diantara angka-angka\njawaban yang desedia.\nCara menjawabnya adalah dengan melingkari pada lembar jawaban di belakang\nnomor soal yang bersangkutan, huruf yang sesuai dengan jawaban soal tersebut.",
    examples: [
      {
        text: "1) 9 - 4 = ...",
        options: ["a. 2", "b. 3", "c. 5", "d. 9", "e. t.a."],
        explanation: "Pada contoh 1, jawaban yang benar adalah 5. Oleh karena itu pada lembar jawaban di belakang contoh 1, huruf c telah dilingkari."
      },
      {
        text: "2) 4 x 2 = ...",
        options: ["a. 6", "b. 7", "c. 9", "d. 8", "e. t.a."],
        explanation: "Jawaban contoh 2 adalah 8. Oleh karena itu pada lembar jawaban di belakang contoh 2, huruf d telah dilingkari pula."
      },
      {
        intro: "Dibawah ini masih terdapat 2 contoh lagi. Kerjakanlah contoh-contoh menurut cara yang sama.",
        text: "3) 2 + 4 = ...",
        options: ["a. 2", "b. 3", "c. 4", "d. 5", "e. t.a."],
        explanation: "Pada contoh 3, jawaban yang benar adalah 6. Oleh karena angka 6 tidak terdapat dalam angka-angka jawaban yang tersedia, maka jawaban yang benar dari contoh 3 adalah t.a. Dengan demikian pada lembar jawaban di belakang contoh 3, huruf e harus dilingkari."
      },
      {
        text: "4) 6 : 3 = ...",
        options: ["a. 2", "b. 4", "c. 9", "d. 12", "e. t.a."],
        explanation: "Jawaban contoh 4 adalah 2. Oleh karena itu pada lembar jawaban di belakang contoh 4, huruf a harus dilingkari."
      }
    ],
    closingInstruction: "Jika perlu, perhitungan-perhitungan dapat dilakukan pada kertas buram yang tersedia.",
    questions: buildMC(t3_data)
  },
  4: {
    title: "TES NUMERIK 04",
    description: "Soal cerita matematika dan penalaran.",
    instructions: "Test ini terdiri atas soal-soal berhitung.\nPerhatikan contoh di bawah ini.",
    examples: [
      {
        text: "1) Seseorang memerlukan waktu 1/2 jam untuk mencat sebuah kursi. Berapa kursikah dapat dicatnya dalam waktu 8 jam?",
        options: ["a. 8 kursi", "b. 10 kursi", "c. 16 kursi", "d. 24 kursi", "e. t.a."],
        explanation: "Pada contoh 1, jawaban yang benar adalah 16 kursi. Di sebelah kanan soal terdapat 5 kemungkinan jawaban a, b, c, d dan e. Dengan demikian jawaban contoh 1 adalah c. Oleh karena itu pada lembar jawaban di belakang contoh 1, huruf c sudah di lingkari."
      },
      {
        text: "2) Ahmad membelanjakan 1/6 dari gaji per jam untuk makan. Gajinya adalah Rp. 47,40. Berapakah dibelanjakannya untuk makanannya?",
        options: ["a. Rp. 5,20", "b. Rp. 6,90", "c. Rp. 7,-", "d. Rp. 7,60", "e. t.a."],
        explanation: "Pada contoh 2 di atas jawaban yang benar adalah Rp. 7,90. Bila kita perhatikan kemungkinan-kemungkinan jawaban yang tersedia, maka tidak terdapat Rp. 7,90. Dengan demikian jawaban yang benar adalah e, yang berarti tidak ada (=t.a.) satupun jawaban yang dimaksudkan. Oleh karena itu pada lembar jawaban di belakang contoh 2, huruf e telah di lingkari."
      },
      {
        intro: "Di bawah ini masih terdapat 2 contoh soal sebagai latihan. Kerjakanlah menurut cara yang sama.",
        text: "3) Harun mendapat upah 75 Rp. tiap jam. Berapa upah yang diterimanya dalam 7 jam?",
        options: ["a. Rp. 400,-", "b. Rp. 475,-", "c. Rp. 490,-", "d. Rp. 525,-", "e. t.a."],
        explanation: "Jawaban contoh 3, adalah Rp. 525,-. Oleh karena itu pada lembar jawaban di belakang contoh 3, huruf d harus di lingkari."
      },
      {
        text: "4) Dari sebilah papan yang panjangnya 4 1/2 meter digergaji sebagian sepanjang 1 1/2 meter. Berapa panjang papan itu jadinya?",
        options: ["a. 2 meter", "b. 2 1/2 meter", "c. 3 meter", "d. 3 1/2 meter", "e. t.a."],
        explanation: "Jawaban yang benar dari contoh 4 adalah 3 meter."
      }
    ],
    closingInstruction: "Jika perlu, perhitungan-perhitungan dapat dilakukan pada kertas buram yang tersedia.",
    questions: buildMC(t4_data)
  },
  5: {
    title: "TES NUMERIK 05",
    description: "Lanjutan konversi huruf ke angka untuk melatih logika.",
    instructions: "Test ini terdiri dari soal-soal berhitung dengan menggunakan huruf-huruf. Tentang menghitung perkalian, misalnya 5 x 12 = ..., kiranya tidak perlu dijelaskan lagi.\n\nTetapi dalam test ini, soal-soalnya tidak terdiri dari angka-angka (bilangan-bilangan), melainkan huruf-huruf.\n\nDiketahui:\nA=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, J=9, K=0\n\nHuruf AB misalnya adalah angka 1 dan 2 berurutan, dan itu berarti sama dengan 12. Diketahui bahwa A=1 dan F=6; dengan demikian AF=16. Perhatikan contoh-contoh dibawah ini:",
    examples: [
      { text: "1) A x C = C", options: ["Benar (b)", "Salah (s)"], explanation: "A x C = 1 x 3 dan hasilnya sama dengan 3 (C). Perhitungan benar, jadi huruf b dilingkari." },
      { text: "2) C x F = AE", options: ["Benar (b)", "Salah (s)"], explanation: "C x F = 3 x 6 = 18 (AH). Hasilnya salah karena seharusnya AH bukan AE. Huruf s dilingkari." },
      { intro: "Cobalah pecahkan sendiri contoh-contoh dibawah ini.", text: "3) G x H = EF", options: ["Benar (b)", "Salah (s)"], explanation: "G x H = 7 x 8 = 56 (EF). Contoh 3 adalah benar (b)." },
      { text: "4) K x B = K", options: ["Benar (b)", "Salah (s)"], explanation: "K x B = 0 x 2 = 0 (K). Contoh 4 adalah benar (b)." },
      { text: "5) B x J = AD", options: ["Benar (b)", "Salah (s)"], explanation: "Contoh 5 adalah salah (s)." },
      { text: "6) J x D = BF", options: ["Benar (b)", "Salah (s)"], explanation: "Contoh 6 adalah salah (s)." },
      { text: "7) AB x C = CF", options: ["Benar (b)", "Salah (s)"], explanation: "Contoh 7 adalah benar (b)." },
      { text: "8) AK x AK = BKK", options: ["Benar (b)", "Salah (s)"], explanation: "Contoh 8 adalah salah (s)." }
    ],
    closingInstruction: "Jika perlu, perhitungan-perhitungan dapat dilakukan pada kertas buram yang tersedia.",
    note: "Kunci: A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, J=9, K=0",
    questions: buildTF(t5_text, t5_ans)
  },
  6: {
    title: "TES NUMERIK 06",
    description: "Tes campuran hitung cepat, huruf-angka, dan soal cerita numerik.",
    instructions: "Tes ini terdiri atas 50 soal campuran.\n\nNomor 1-20 adalah soal hitung cepat dengan lima pilihan jawaban a, b, c, d, dan e.\n\nNomor 21-40 adalah soal kode huruf-angka dengan pilihan Benar (b) atau Salah (s). Pada bagian ini berlaku ketentuan A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, J=9, dan K=0.\n\nNomor 41-50 adalah soal cerita numerik dengan lima pilihan jawaban a, b, c, d, dan e.\n\nKerjakan setiap soal dengan teliti dan pilih jawaban yang paling tepat.",
    examples: [
      {
        text: "1) 12 + 6 × 2 = ...",
        options: ["a. 22", "b. 24", "c. 26", "d. 28", "e. 30"],
        explanation: "Dahulukan perkalian: 6 × 2 = 12. Kemudian 12 + 12 = 24. Jadi jawaban contoh ini adalah b."
      },
      {
        text: "2) B x F = AC",
        options: ["Benar (b)", "Salah (s)"],
        explanation: "B = 2 dan F = 6, maka 2 × 6 = 12. Angka 12 ditulis AB, bukan AC. Jadi jawaban contoh ini adalah s."
      },
      {
        text: "3) Dita menabung Rp. 10.000,- setiap hari selama 6 hari. Berapa jumlah tabungannya?",
        options: ["a. Rp. 40.000,-", "b. Rp. 50.000,-", "c. Rp. 60.000,-", "d. Rp. 70.000,-", "e. t.a."],
        explanation: "6 × 10.000 = Rp. 60.000,-. Jadi jawaban contoh ini adalah c."
      }
    ],
    closingInstruction: "Jika perlu, perhitungan-perhitungan dapat dilakukan pada kertas buram yang tersedia.",
    questions: t6_questions
  }
};


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome'); // welcome, home, instruction, quiz, result
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showQuestionPanel, setShowQuestionPanel] = useState(true);
  const [resultFocusIndex, setResultFocusIndex] = useState(0);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (currentScreen === 'quiz') {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [currentScreen]);

  // Formatter functions
  const formatTimeFull = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m} menit ${s} detik`;
  };

  const formatTimeCompact = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stripQuestionPrefix = (text) => text.replace(/^\d+\)\s*/, '');

  // Handlers
  const handleStartTest = (testId) => {
    setActiveTest(testId);
    setCurrentScreen('instruction');
  };

  const handleBeginQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimerSeconds(0);
    setShowQuestionPanel(true);
    setResultFocusIndex(0);
    setCurrentScreen('quiz');
  };

  const handleSelectOption = (optionId) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < TEST_DATA[activeTest].questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleJumpToQuestion = (questionIndex) => {
    setCurrentQuestionIndex(questionIndex);
  };

  const handleScrollToReview = (questionIndex) => {
    setResultFocusIndex(questionIndex);
  };

  const handleSubmit = () => {
    setResultFocusIndex(0);
    setCurrentScreen('result');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setActiveTest(null);
  };

  // VIEWS
  const renderWelcome = () => {
    const trimmedName = nameInput.trim();

    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 min-h-screen flex items-center animate-in fade-in zoom-in duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 w-full">
          <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Portal Latihan Psikotes
            </div>
            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
              Persiapan tes numerik yang rapi dan mudah dipakai.
            </h1>
            <p className="mt-4 text-blue-50 text-base sm:text-lg leading-relaxed max-w-2xl">
              Masukkan nama siswa untuk masuk ke dashboard latihan. Setelah itu siswa bisa memilih modul tes, mengerjakan soal, dan melihat hasil evaluasi langsung.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg border border-gray-200">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              Dashboard Awal
            </div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-800 leading-tight">
              Masuk sebagai siswa
            </h2>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Nama ini akan ditampilkan di dashboard dan halaman hasil agar sesi latihan terasa lebih personal.
            </p>

            <div className="mt-8 space-y-3">
              <label htmlFor="student-name" className="block text-sm font-bold text-gray-700">
                Nama siswa
              </label>
              <input
                id="student-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && trimmedName) {
                    setStudentName(trimmedName);
                    setCurrentScreen('home');
                  }
                }}
                placeholder="Contoh: Ahmad Fauzan"
                className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-lg text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 leading-relaxed">
              Saran penggunaan:
              <div className="mt-2">1. Isi nama siswa</div>
              <div>2. Masuk ke dashboard</div>
              <div>3. Pilih tes dan mulai latihan</div>
            </div>

            <button
              onClick={() => {
                if (!trimmedName) return;
                setStudentName(trimmedName);
                setCurrentScreen('home');
              }}
              disabled={!trimmedName}
              className={`mt-6 w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold transition ${
                trimmedName
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Masuk ke Dashboard <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-3 sm:space-y-4 bg-blue-600 text-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-left">
          <div className="bg-white/12 border border-white/15 rounded-2xl px-4 py-3 text-center sm:text-left w-full sm:w-auto">
            <div className="text-xs uppercase tracking-[0.2em] text-blue-100 font-bold">Siswa Aktif</div>
            <div className="text-lg sm:text-xl font-bold mt-1">{studentName || 'Siswa'}</div>
          </div>
          <button
            onClick={() => setCurrentScreen('welcome')}
            className="w-full sm:w-auto rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15 transition"
          >
            Ganti Nama
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Portal Psikotes Numerik</h1>
        <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
          Selamat datang, {studentName || 'Siswa'}. Pilih modul tes di bawah ini untuk memulai latihan. Setiap tes memiliki aturan, contoh soal, dan jumlah soal khusus sesuai format asli.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(TEST_DATA).map(([id, test]) => (
          <div key={id} className="bg-white border border-gray-200 p-5 sm:p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{test.title}</h3>
              </div>
              <p className="text-gray-600 mb-2 leading-relaxed">{test.description}</p>
              <p className="text-sm font-bold text-blue-500 mb-6 bg-blue-50 inline-block px-3 py-1 rounded-full">
                {test.questions.length} Soal Ujian
              </p>
            </div>
            <button 
              onClick={() => handleStartTest(id)}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 font-semibold py-3 px-4 rounded-xl transition-colors border border-gray-200 hover:border-blue-600"
            >
              <PlayCircle className="w-5 h-5" />
              Mulai Tes
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInstruction = () => {
    const test = TEST_DATA[activeTest];
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-in slide-in-from-right-8 duration-300">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg border border-gray-100">
          <button onClick={handleBackToHome} className="text-gray-400 hover:text-gray-700 flex items-center gap-2 mb-6 transition-colors text-sm sm:text-base">
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">Instruksi {test.title}</h2>
            <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl text-base sm:text-lg">
              Total: {test.questions.length} Soal
            </div>
          </div>
          
          <div className="bg-blue-50 text-blue-900 p-5 sm:p-6 md:p-8 rounded-2xl mb-8 text-base sm:text-lg leading-relaxed whitespace-pre-line shadow-inner break-words">
            {test.instructions}
            
            {test.examples && (
              <div className="mt-8 space-y-6">
                <h3 className="font-bold text-lg sm:text-xl border-b border-blue-200 pb-2">Contoh Soal Latihan:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.examples.map((ex, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
                      <div>
                        {ex.intro && <p className="mb-4 text-blue-800 font-medium italic">{ex.intro}</p>}
                        <p className="font-bold mb-4 text-lg sm:text-xl break-words">{ex.text}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {ex.options.map((opt, i) => (
                            <span key={i} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200">
                              {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 mt-2">
                        {ex.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {test.closingInstruction && (
              <div className="mt-8 p-4 bg-amber-50 text-amber-800 rounded-xl font-medium text-center border border-amber-200 text-sm sm:text-base">
                {test.closingInstruction}
              </div>
            )}

            {test.note && (
              <div className="mt-6 p-4 bg-yellow-100 text-yellow-800 rounded-xl font-mono text-left sm:text-center text-xs sm:text-sm font-bold shadow-sm overflow-x-auto">
                {test.note}
              </div>
            )}
          </div>

          <button 
            onClick={handleBeginQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl font-bold py-3.5 sm:py-4 rounded-2xl shadow-md transition-transform transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            Siap, Mulai Kerjakan! <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const test = TEST_DATA[activeTest];
    const question = test.questions[currentQuestionIndex];
    const questionNote = question.note || test.note;
    const isLastQuestion = currentQuestionIndex === test.questions.length - 1;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-6 animate-in slide-in-from-bottom-8 duration-300">
        {/* Header Quiz */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 sticky top-3 sm:top-4 z-10">
          <div className="font-semibold text-sm sm:text-base text-gray-700 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 text-center sm:text-left">
            Soal {currentQuestionIndex + 1} dari {test.questions.length}
          </div>
          <div className="flex items-center justify-center gap-2 font-bold text-sm sm:text-base text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
            <Clock className="w-5 h-5" /> {formatTimeCompact(timerSeconds)}
          </div>
        </div>

        <div className="mb-6 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1">
              <div className="text-sm sm:text-base font-semibold text-slate-700">
                Terjawab: <span className="text-emerald-600">{answeredCount}</span> / {test.questions.length}
              </div>
              <div className="text-xs sm:text-sm text-slate-500">
                Soal aktif: {currentQuestionIndex + 1}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuestionPanel((prev) => !prev)}
              className="w-full sm:w-auto rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-100 transition"
            >
              {showQuestionPanel ? 'Sembunyikan Panel' : 'Tampilkan Panel'}
            </button>
          </div>

          {showQuestionPanel && (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
              {test.questions.map((_, index) => {
                const isActive = index === currentQuestionIndex;
                const isAnswered = answers[index] !== undefined;

                const stateClasses = isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : isAnswered
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50';

                return (
                  <button
                    key={`jump-${index}`}
                    type="button"
                    onClick={() => handleJumpToQuestion(index)}
                    className={`h-11 sm:h-12 rounded-xl border text-sm sm:text-base font-bold transition ${stateClasses}`}
                    aria-label={`Buka soal ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Note Helper (if exists) */}
        {questionNote && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl font-mono text-left sm:text-center text-xs sm:text-sm font-bold shadow-sm overflow-x-auto">
            {questionNote}
          </div>
        )}

        {/* Question Area */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-200 mb-6 min-h-[280px] sm:min-h-[300px]">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 sm:mb-8 leading-normal break-words">{stripQuestionPrefix(question.text)}</h3>
          
          <div className="space-y-4">
            {question.options.map((opt) => (
              <label 
                key={opt.id} 
                className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${
                  answers[currentQuestionIndex] === opt.id 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input 
                  type="radio" 
                  name={`q-${currentQuestionIndex}`} 
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 mt-1 shrink-0"
                  checked={answers[currentQuestionIndex] === opt.id}
                  onChange={() => handleSelectOption(opt.id)}
                />
                <span className="flex-1 text-base sm:text-lg text-gray-700 font-medium leading-relaxed break-words">
                  {questionNote ? '' : <span className="uppercase mr-2 text-gray-400 font-bold">{opt.id}.</span>}
                  {opt.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <button 
            onClick={handlePrev} 
            disabled={currentQuestionIndex === 0}
            className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl font-semibold transition-colors text-sm sm:text-base ${
              currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Sebelumnya
          </button>

          {isLastQuestion ? (
            <button 
              onClick={handleSubmit}
              className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-bold shadow-md transition-transform transform hover:scale-[1.02] text-sm sm:text-base ${
                Object.keys(answers).length === test.questions.length 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <CheckCircle className="w-5 h-5" /> Selesai & Cek Hasil
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors text-sm sm:text-base"
            >
              Selanjutnya <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const test = TEST_DATA[activeTest];
    let correctCount = 0;
    let answeredCount = Object.keys(answers).length;
    let emptyCount = test.questions.length - answeredCount;
    
    test.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / test.questions.length) * 100);
    const wrongCount = answeredCount - correctCount;
    const focusedQuestion = test.questions[resultFocusIndex] || test.questions[0];
    const focusedUserAnswer = answers[resultFocusIndex];
    const focusedIsCorrect = focusedUserAnswer === focusedQuestion.correctAnswer;
    const focusedIsEmpty = !focusedUserAnswer;
    const focusedUserAnswerText = focusedQuestion.options.find((o) => o.id === focusedUserAnswer)?.text || "TIDAK DIJAWAB";
    const focusedCorrectAnswerText = focusedQuestion.options.find((o) => o.id === focusedQuestion.correctAnswer)?.text;
    const performanceReview = getResultFeedback(score, timerSeconds);

    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 animate-in slide-in-from-bottom-12 duration-500">
        
        {/* Result Header */}
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
          <Award className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 ${score > 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">Hasil Evaluasi</h2>
          <p className="text-sm sm:text-base font-semibold text-blue-600 mb-1">Peserta: {studentName || 'Siswa'}</p>
          <p className="text-gray-500 mb-6 font-medium">{test.title}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-5 rounded-2xl min-w-0 border border-blue-100">
              <div className="text-sm text-blue-600 font-bold mb-1">Skor Akhir (Persen)</div>
              <div className="text-4xl sm:text-5xl font-black text-blue-700">{score}%</div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-2xl min-w-0 border border-emerald-100">
              <div className="text-sm text-emerald-600 font-bold mb-1">Benar</div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-700">{correctCount}</div>
              <div className="text-xs text-emerald-600 mt-1">dari {test.questions.length} soal</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl min-w-0 border border-gray-200">
              <div className="text-sm text-gray-600 font-bold mb-1">Tidak Dijawab</div>
              <div className="text-3xl font-black text-gray-600 mt-2">{emptyCount}</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl min-w-0 border border-gray-200">
              <div className="text-sm text-gray-600 font-bold mb-1">Waktu Pengerjaan</div>
              <div className="text-xl sm:text-2xl mt-3 font-bold text-gray-700 break-words">{formatTimeFull(timerSeconds)}</div>
            </div>
          </div>
        </div>

        <div className="mb-8 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
              {performanceReview.scoreLabel}
            </span>
            <span className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700">
              {performanceReview.timeLabel}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 leading-tight">{performanceReview.title}</h3>
          <p className="mt-3 text-gray-600 leading-relaxed">{performanceReview.review}</p>
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
            <p className="text-emerald-900 leading-relaxed">{performanceReview.motivation}</p>
          </div>
        </div>

        <div className="mb-8 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-bold text-emerald-700">
              Benar {correctCount}
            </span>
            <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1.5 text-sm font-bold text-rose-700">
              Salah {wrongCount}
            </span>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-sm font-bold text-amber-700">
              Kosong {emptyCount}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3">
            {test.questions.map((q, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === q.correctAnswer;
              const isEmpty = !userAnswer;
              const isFocused = resultFocusIndex === index;

              const stateClasses = isEmpty
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : isCorrect
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100';

              const focusClasses = isEmpty
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : isCorrect
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-rose-600 text-white border-rose-600 shadow-md';

              return (
                <button
                  key={`result-nav-${q.id}`}
                  type="button"
                  onClick={() => handleScrollToReview(index)}
                  className={`h-11 sm:h-12 rounded-xl border text-sm sm:text-base font-bold transition ${isFocused ? focusClasses : stateClasses}`}
                  aria-label={`Lihat review soal ${index + 1}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 pl-2">Pembahasan Soal</h3>
        <div className={`bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border-2 shadow-sm ${focusedIsCorrect ? 'border-emerald-200' : (focusedIsEmpty ? 'border-amber-200' : 'border-rose-200')}`}>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start mb-4">
            <div className="mt-1 self-start">
              {focusedIsCorrect ? (
                <CheckCircle className="w-8 h-8 text-emerald-500 bg-emerald-50 rounded-full" />
              ) : (
                <XCircle className={`w-8 h-8 rounded-full ${focusedIsEmpty ? 'text-amber-500 bg-amber-50' : 'text-rose-500 bg-rose-50'}`} />
              )}
            </div>
            <div className="flex-1 w-full overflow-hidden">
              <div className="inline-flex rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
                Soal {resultFocusIndex + 1}
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 break-words">{stripQuestionPrefix(focusedQuestion.text)}</h4>

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className={`px-4 py-3 rounded-xl flex-1 border ${focusedIsCorrect ? 'bg-emerald-50 border-emerald-100' : (focusedIsEmpty ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100')}`}>
                  <span className="text-sm block mb-1 font-medium opacity-80">Jawaban Kamu:</span>
                  <span className={`font-semibold text-base sm:text-lg break-words ${focusedIsCorrect ? 'text-emerald-700' : (focusedIsEmpty ? 'text-amber-700' : 'text-rose-700')}`}>
                    {focusedUserAnswerText}
                  </span>
                </div>
                {!focusedIsCorrect && (
                  <div className="bg-blue-50 px-4 py-3 rounded-xl flex-1 border border-blue-100">
                    <span className="text-sm text-blue-600 block mb-1 font-medium">Kunci Jawaban:</span>
                    <span className="font-semibold text-base sm:text-lg break-words text-blue-800">{focusedCorrectAnswerText}</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 text-gray-700 p-4 rounded-xl text-sm leading-relaxed border border-gray-200 break-words">
                <strong>Pembahasan: </strong>{focusedQuestion.explanation}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 mb-10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <button
            onClick={() => setResultFocusIndex((prev) => Math.max(prev - 1, 0))}
            disabled={resultFocusIndex === 0}
            className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl font-semibold transition-colors text-sm sm:text-base ${
              resultFocusIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Soal Sebelumnya
          </button>
          <button
            onClick={() => setResultFocusIndex((prev) => Math.min(prev + 1, test.questions.length - 1))}
            disabled={resultFocusIndex === test.questions.length - 1}
            className={`flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-3 rounded-xl font-semibold transition-colors text-sm sm:text-base ${
              resultFocusIndex === test.questions.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            Soal Berikutnya <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-10 mb-20 flex justify-center gap-4 flex-wrap">
          <button 
            onClick={handleBeginQuiz}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
          >
            <RotateCcw className="w-5 h-5" /> Ulangi Tes Ini
          </button>
          <button 
            onClick={handleBackToHome}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            <Home className="w-5 h-5" /> Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-blue-200 pb-10">
      {currentScreen === 'welcome' && renderWelcome()}
      {currentScreen === 'home' && renderHome()}
      {currentScreen === 'instruction' && renderInstruction()}
      {currentScreen === 'quiz' && renderQuiz()}
      {currentScreen === 'result' && renderResult()}
    </div>
  );
}
