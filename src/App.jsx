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

const buildTF = (texts, answers) => texts.map((t, i) => ({
  id: `q${i+1}`,
  text: `${i+1}) ${t}`,
  options: [{ id: 'b', text: 'Benar (b)' }, { id: 's', text: 'Salah (s)' }],
  correctAnswer: answers[i],
  explanation: explainLetters(t, answers[i])
}));

const buildMC = (data) => data.map((d, i) => ({
  id: `q${i+1}`,
  text: `${i+1}) ${d[0]}`,
  options: d[1].map((opt, j) => ({ id: ['a','b','c','d','e'][j], text: opt })),
  correctAnswer: d[2],
  explanation: d[3] || "Sesuai dengan hasil perhitungan matematika yang benar."
}));

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
  }
};


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // home, instruction, quiz, result
  const [activeTest, setActiveTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timerSeconds, setTimerSeconds] = useState(0);

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

  // Handlers
  const handleStartTest = (testId) => {
    setActiveTest(testId);
    setCurrentScreen('instruction');
  };

  const handleBeginQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimerSeconds(0);
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

  const handleSubmit = () => {
    setCurrentScreen('result');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setActiveTest(null);
  };

  // VIEWS
  const renderHome = () => (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-4 bg-blue-600 text-white p-10 rounded-3xl shadow-lg">
        <h1 className="text-4xl font-extrabold tracking-tight">Portal Psikotes Numerik</h1>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
          Pilih modul tes di bawah ini untuk memulai latihan. Setiap tes memiliki aturan, contoh soal, dan jumlah soal khusus sesuai format asli.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(TEST_DATA).map(([id, test]) => (
          <div key={id} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{test.title}</h3>
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
      <div className="max-w-4xl mx-auto p-6 animate-in slide-in-from-right-8 duration-300">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <button onClick={handleBackToHome} className="text-gray-400 hover:text-gray-700 flex items-center gap-2 mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5" /> Kembali
          </button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h2 className="text-3xl font-bold text-gray-800">Instruksi {test.title}</h2>
            <div className="bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl text-lg">
              Total: {test.questions.length} Soal
            </div>
          </div>
          
          <div className="bg-blue-50 text-blue-900 p-6 md:p-8 rounded-2xl mb-8 text-lg leading-relaxed whitespace-pre-line shadow-inner">
            {test.instructions}
            
            {test.examples && (
              <div className="mt-8 space-y-6">
                <h3 className="font-bold text-xl border-b border-blue-200 pb-2">Contoh Soal Latihan:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {test.examples.map((ex, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
                      <div>
                        {ex.intro && <p className="mb-4 text-blue-800 font-medium italic">{ex.intro}</p>}
                        <p className="font-bold mb-4 text-xl">{ex.text}</p>
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
              <div className="mt-8 p-4 bg-amber-50 text-amber-800 rounded-xl font-medium text-center border border-amber-200">
                {test.closingInstruction}
              </div>
            )}

            {test.note && (
              <div className="mt-6 p-4 bg-yellow-100 text-yellow-800 rounded-xl font-mono text-center font-bold shadow-sm">
                {test.note}
              </div>
            )}
          </div>

          <button 
            onClick={handleBeginQuiz}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl shadow-md transition-transform transform hover:scale-[1.02] flex items-center justify-center gap-2"
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
    const isLastQuestion = currentQuestionIndex === test.questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in slide-in-from-bottom-8 duration-300">
        {/* Header Quiz */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200 sticky top-4 z-10">
          <div className="font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-xl border border-gray-200">
            Soal {currentQuestionIndex + 1} dari {test.questions.length}
          </div>
          <div className="flex items-center gap-2 font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
            <Clock className="w-5 h-5" /> {formatTimeCompact(timerSeconds)}
          </div>
        </div>

        {/* Note Helper (if exists) */}
        {test.note && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl font-mono text-center text-sm font-bold shadow-sm">
            {test.note}
          </div>
        )}

        {/* Question Area */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 mb-6 min-h-[300px]">
          <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-normal">{question.text}</h3>
          
          <div className="space-y-4">
            {question.options.map((opt) => (
              <label 
                key={opt.id} 
                className={`flex items-center p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200 ${
                  answers[currentQuestionIndex] === opt.id 
                    ? 'border-blue-600 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input 
                  type="radio" 
                  name={`q-${currentQuestionIndex}`} 
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-4"
                  checked={answers[currentQuestionIndex] === opt.id}
                  onChange={() => handleSelectOption(opt.id)}
                />
                <span className="text-lg text-gray-700 font-medium">
                  {test.note ? '' : <span className="uppercase mr-2 text-gray-400 font-bold">{opt.id}.</span>}
                  {opt.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button 
            onClick={handlePrev} 
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
              currentQuestionIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Sebelumnya
          </button>

          {isLastQuestion ? (
            <button 
              onClick={handleSubmit}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-transform transform hover:scale-[1.02] ${
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
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-colors"
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

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 animate-in slide-in-from-bottom-12 duration-500">
        
        {/* Result Header */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
          <Award className={`w-20 h-20 mx-auto mb-4 ${score > 70 ? 'text-emerald-500' : 'text-amber-500'}`} />
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Hasil Evaluasi</h2>
          <p className="text-gray-500 mb-6 font-medium">{test.title}</p>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <div className="bg-blue-50 p-5 rounded-2xl min-w-[130px] border border-blue-100">
              <div className="text-sm text-blue-600 font-bold mb-1">Skor Akhir</div>
              <div className="text-5xl font-black text-blue-700">{score}</div>
            </div>
            <div className="bg-emerald-50 p-5 rounded-2xl min-w-[130px] border border-emerald-100">
              <div className="text-sm text-emerald-600 font-bold mb-1">Benar</div>
              <div className="text-5xl font-black text-emerald-700">{correctCount}</div>
              <div className="text-xs text-emerald-600 mt-1">dari {test.questions.length} soal</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl min-w-[130px] border border-gray-200">
              <div className="text-sm text-gray-600 font-bold mb-1">Tidak Dijawab</div>
              <div className="text-3xl font-black text-gray-600 mt-2">{emptyCount}</div>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl min-w-[130px] border border-gray-200">
              <div className="text-sm text-gray-600 font-bold mb-1">Waktu Pengerjaan</div>
              <div className="text-2xl mt-3 font-bold text-gray-700">{formatTimeFull(timerSeconds)}</div>
            </div>
          </div>
        </div>

        {/* Review List */}
        <h3 className="text-2xl font-bold text-gray-800 mb-6 pl-2">Review & Kunci Jawaban</h3>
        <div className="space-y-6">
          {test.questions.map((q, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            const isEmpty = !userAnswer;
            
            // Find option text for display
            const userAnswerText = q.options.find(o => o.id === userAnswer)?.text || "TIDAK DIJAWAB";
            const correctAnswerText = q.options.find(o => o.id === q.correctAnswer)?.text;

            return (
              <div key={q.id} className={`bg-white p-6 md:p-8 rounded-3xl border-2 shadow-sm ${isCorrect ? 'border-emerald-200' : (isEmpty ? 'border-amber-200' : 'border-rose-200')}`}>
                <div className="flex gap-4 items-start mb-4">
                  <div className="mt-1">
                    {isCorrect ? (
                      <CheckCircle className="w-8 h-8 text-emerald-500 bg-emerald-50 rounded-full" />
                    ) : (
                      <XCircle className={`w-8 h-8 rounded-full ${isEmpty ? 'text-amber-500 bg-amber-50' : 'text-rose-500 bg-rose-50'}`} />
                    )}
                  </div>
                  <div className="flex-1 w-full overflow-hidden">
                    <h4 className="text-xl font-bold text-gray-800 mb-3 break-words">{q.text}</h4>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                      <div className={`px-4 py-3 rounded-xl flex-1 border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : (isEmpty ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100')}`}>
                        <span className="text-sm block mb-1 font-medium opacity-80">Jawaban Kamu:</span>
                        <span className={`font-semibold text-lg ${isCorrect ? 'text-emerald-700' : (isEmpty ? 'text-amber-700' : 'text-rose-700')}`}>
                          {userAnswerText}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="bg-blue-50 px-4 py-3 rounded-xl flex-1 border border-blue-100">
                          <span className="text-sm text-blue-600 block mb-1 font-medium">Kunci Jawaban:</span>
                          <span className="font-semibold text-lg text-blue-800">{correctAnswerText}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 text-gray-700 p-4 rounded-xl text-sm leading-relaxed border border-gray-200">
                      <strong>Pembahasan: </strong>{q.explanation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-10 mb-20 flex justify-center gap-4 flex-wrap">
          <button 
            onClick={handleBeginQuiz}
            className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 font-bold py-3 px-6 rounded-xl transition-colors shadow-sm"
          >
            <RotateCcw className="w-5 h-5" /> Ulangi Tes Ini
          </button>
          <button 
            onClick={handleBackToHome}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
          >
            <Home className="w-5 h-5" /> Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-blue-200 pb-10">
      {currentScreen === 'home' && renderHome()}
      {currentScreen === 'instruction' && renderInstruction()}
      {currentScreen === 'quiz' && renderQuiz()}
      {currentScreen === 'result' && renderResult()}
    </div>
  );
}
