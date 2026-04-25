import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, FileText, PlayCircle, Home, Award } from 'lucide-react';

// --- DATA BUILDER HELPERS ---
const valMap = {A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, J:9, K:0};
const getVal = (str) => parseInt(str.split('').map(char => valMap[char]).join(''), 10);
const toLetters = (num) => num.toString().split('').map(digit => Object.keys(valMap).find(k => valMap[k] == digit)).join('');
const stripQuestionNumber = (text = '') => text.replace(/^\d+\)\s*/, '').trim();
const makeExplanation = (step1, step2, why, tip) => ({ step1, step2, why, tip });
const isTrueFalseQuestion = (question) => question.options.length === 2 && question.options.some((opt) => opt.id === 'b') && question.options.some((opt) => opt.id === 's');
const isNumericInputQuestion = (question) => question.answerType === 'numeric_input';
const sanitizeDigitsInput = (value = '') => value.replace(/\D/g, '');
const normalizeDigitsValue = (value = '') => {
  const digits = sanitizeDigitsInput(value);
  if (!digits) return '';
  return String(Number(digits));
};
const hasAnswer = (question, userAnswer) => {
  if (isNumericInputQuestion(question)) {
    return sanitizeDigitsInput(String(userAnswer ?? '')) !== '';
  }
  return userAnswer !== undefined && userAnswer !== null;
};
const isAnswerCorrect = (question, userAnswer) => {
  if (!hasAnswer(question, userAnswer)) return false;
  if (isNumericInputQuestion(question)) {
    return normalizeDigitsValue(String(userAnswer)) === normalizeDigitsValue(String(question.correctAnswer));
  }
  return userAnswer === question.correctAnswer;
};
const isPureCalculationQuestion = (text = '') => {
  const cleaned = stripQuestionNumber(text).replace(/\s*=\s*\.\.\.\s*$/, '').trim();
  return /^[\d\s+\-×x:/.]+$/.test(cleaned);
};
const getOptionById = (question, optionId) => question.options.find((opt) => opt.id === optionId);
const getAnswerSummary = (question) => {
  const correctOption = getOptionById(question, question.correctAnswer);
  if (!correctOption) return '';

  const optionLabel = question.correctAnswer.toUpperCase();
  if (correctOption.text.toLowerCase() === 't.a.') {
    return `Karena hasil akhir tidak tersedia pada pilihan a sampai d, jawaban yang benar adalah t.a. (opsi ${optionLabel}).`;
  }

  return `Jadi jawaban yang tepat adalah ${correctOption.text} (opsi ${optionLabel}).`;
};

const getStoryCategory = (questionText, rawExplanation) => {
  const text = `${questionText} ${rawExplanation}`.toLowerCase();

  if (text.includes('%') || text.includes('persen')) return 'percent';
  if (text.includes('meter persegi') || text.includes('luas') || (text.includes('panjang') && text.includes('lebar'))) return 'area';
  if (text.includes('umur')) return 'age';
  if (text.includes('rp') || text.includes('harga') || text.includes('bayar') || text.includes('pajak') || text.includes('upah') || text.includes('belanja') || text.includes('tabung')) return 'money';
  if (text.includes('pukul') || text.includes('menit') || text.includes('jam')) return 'time';
  if (text.includes('perputaran') || text.includes('kali lebih banyak') || text.includes('perbandingan')) return 'ratio';
  if (/\b\d+\/\d+\b/.test(text)) return 'fraction';
  if (text.includes('setiap') || text.includes('tiap') || text.includes('dalam') || text.includes('kecepatan') || text.includes('jarak') || text.includes('km') || text.includes('liter')) return 'rate';

  return 'general';
};

const getStoryStep1 = (category) => {
  const copy = {
    rate: 'Tentukan dulu hubungan dasarnya: berapa hasil untuk 1 satuan waktu, 1 orang, 1 liter, atau 1 unit. Setelah itu baru kalikan atau bagi sesuai yang ditanyakan.',
    money: 'Pisahkan dulu semua komponen uang pada cerita, lalu tentukan apakah harus dijumlahkan, dikurangkan, atau dibagi rata.',
    percent: 'Ubah dulu persen menjadi bagian dari total. Setelah itu hitung nilai yang diminta dengan perkalian atau pembagian yang sesuai.',
    area: 'Ambil ukuran yang diketahui, lalu gunakan rumus yang sesuai. Untuk persegi panjang, luas dihitung dari panjang × lebar.',
    age: 'Tulis dulu umur masing-masing dalam angka. Setelah itu kerjakan seperti soal hitung biasa: dijumlahkan atau dicari selisihnya.',
    time: 'Samakan dulu satuan waktunya. Jika ada jam dan menit, ubah dulu agar lebih mudah sebelum mencari selisih atau total.',
    ratio: 'Cari dulu perbandingan atau faktor pengali yang diberikan di soal, lalu gunakan faktor itu pada data yang baru.',
    fraction: 'Ubah dulu pecahan menjadi nilai nyata dari jumlah yang diketahui. Setelah itu baru cari sisa atau hasil akhirnya.',
    general: 'Ambil data penting dari cerita, lalu tentukan operasi hitung yang paling sesuai dengan hubungan antar data di soal.'
  };

  return copy[category] || copy.general;
};

const getStoryWhy = (category) => {
  const copy = {
    rate: 'Soal jenis ini memakai konsep laju atau hasil per satuan. Begitu nilai per satuan ditemukan, sisa hitungannya menjadi langsung.',
    money: 'Soal uang harus dibaca sebagai arus masuk dan keluar. Karena itu langkahnya adalah memisahkan komponen biaya lalu menjumlahkan atau mengurangkan dengan rapi.',
    percent: 'Persen selalu berarti bagian dari seratus. Dengan mengubahnya ke bentuk pecahan atau desimal, perhitungannya menjadi lebih mudah dipahami.',
    area: 'Karena yang dicari adalah ukuran bidang, kita memakai rumus luas. Rumus ini langsung menghubungkan ukuran panjang dan lebar.',
    age: 'Soal umur sebenarnya hanya soal penjumlahan dan pengurangan. Kuncinya adalah menuliskan umur tiap orang dengan jelas lebih dulu.',
    time: 'Waktu sering membingungkan kalau satuannya campur. Karena itu penyamaan satuan adalah langkah penting sebelum menghitung hasil akhir.',
    ratio: 'Perbandingan bekerja lewat faktor pengali yang sama. Kalau faktor itu sudah ditemukan, data baru tinggal disesuaikan dengan faktor yang sama.',
    fraction: 'Pecahan menunjukkan bagian dari keseluruhan. Maka kita harus mencari nilai bagian itu terlebih dulu sebelum melanjutkan ke hasil akhir.',
    general: 'Pembahasan soal cerita selalu lebih mudah jika data penting, operasi, dan tujuan akhir dipisahkan dengan jelas.'
  };

  return copy[category] || copy.general;
};

const getStoryTip = (category) => {
  const copy = {
    rate: 'Jika soal berbunyi “setiap”, “tiap”, atau “dalam x jam”, biasanya cara tercepat adalah mencari nilai per 1 satuan terlebih dulu.',
    money: 'Kelompokkan harga yang sama atau biaya yang sejenis lebih dulu. Cara ini mencegah salah jumlah.',
    percent: 'Gunakan patokan cepat: 50% = 1/2, 25% = 1/4, 10% = 1/10. Ini sangat membantu untuk hitung mental.',
    area: 'Begitu melihat kata panjang dan lebar, segera ingat rumus luas = panjang × lebar.',
    age: 'Soal umur lebih aman kalau ditulis ulang dalam bentuk angka singkat, misalnya “adik = 16 - 3”.',
    time: 'Ubah jam ke menit atau sebaliknya sebelum mulai menghitung. Ini mengurangi risiko salah baca.',
    ratio: 'Cari dulu “berapa kali lebih besar/kecil” dari data lama ke data baru. Setelah itu tinggal kalikan.',
    fraction: 'Ubah pecahan ke bentuk nilai nyata dulu, misalnya 1/4 dari 36 berarti 36 ÷ 4.',
    general: 'Tandai dulu apa yang diketahui dan apa yang ditanyakan. Dengan begitu operasi hitungnya lebih cepat terlihat.'
  };

  return copy[category] || copy.general;
};

const tokenizeArithmeticExpression = (expression) => {
  const cleaned = stripQuestionNumber(expression)
    .replace(/\s*=\s*\.\.\.\s*$/, '')
    .replace(/x/g, '×')
    .replace(/\//g, ':')
    .trim();

  return cleaned.match(/\d+|[+\-×:]/g) || [];
};

const applyArithmeticOperation = (left, operator, right) => {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '×':
      return left * right;
    case ':':
      return left / right;
    default:
      return right;
  }
};

const evaluateArithmeticExpression = (expression) => {
  const tokens = tokenizeArithmeticExpression(expression);
  const workingTokens = [...tokens];
  const prioritySteps = [];

  let index = 1;
  while (index < workingTokens.length - 1) {
    const operator = workingTokens[index];
    if (operator === '×' || operator === ':') {
      const left = Number(workingTokens[index - 1]);
      const right = Number(workingTokens[index + 1]);
      const result = applyArithmeticOperation(left, operator, right);
      prioritySteps.push(`${left} ${operator} ${right} = ${result}`);
      workingTokens.splice(index - 1, 3, String(result));
      index = 1;
      continue;
    }
    index += 2;
  }

  const afterPriority = workingTokens.join(' ');
  const linearSteps = [];

  while (workingTokens.length > 1) {
    const left = Number(workingTokens[0]);
    const operator = workingTokens[1];
    const right = Number(workingTokens[2]);
    const result = applyArithmeticOperation(left, operator, right);
    linearSteps.push(`${left} ${operator} ${right} = ${result}`);
    workingTokens.splice(0, 3, String(result));
  }

  return {
    tokens,
    prioritySteps,
    linearSteps,
    afterPriority,
    result: Number(workingTokens[0])
  };
};

const getArithmeticWhy = (analysis) => {
  if (analysis.tokens.includes('×') || analysis.tokens.includes(':')) {
    return 'Pada hitung campuran, perkalian dan pembagian dikerjakan lebih dulu. Jika tingkat operasinya sama, kerjakan dari kiri ke kanan.';
  }

  return 'Karena soal ini hanya berisi penjumlahan dan/atau pengurangan, urutannya cukup dikerjakan dari kiri ke kanan.';
};

const getArithmeticTip = (questionText, analysis) => {
  const cleaned = stripQuestionNumber(questionText).replace(/\s*=\s*\.\.\.\s*$/, '').trim();

  if (cleaned.includes('× 40') || cleaned.includes('40 ×')) {
    return 'Kali 40 bisa dipikir sebagai kali 4 lalu tambahkan satu nol di belakang hasilnya.';
  }

  if (cleaned.includes(': 5') || cleaned.includes(':5')) {
    return 'Bagi 5 bisa dipercepat dengan mengalikan 2 lebih dulu, lalu membagi 10.';
  }

  if (!analysis.tokens.includes('×') && !analysis.tokens.includes(':') && analysis.tokens.filter((token) => token === '+' || token === '-').length >= 2) {
    return 'Untuk penjumlahan atau pengurangan berantai, pasangkan angka yang mudah dibulatkan agar hitungan mental lebih cepat.';
  }

  if (analysis.tokens.includes('×') || analysis.tokens.includes(':')) {
    return 'Saat melihat hitung campuran, lingkari dulu bagian kali atau bagi. Setelah bagian itu selesai, sisa hitungannya biasanya menjadi lebih ringan.';
  }

  return 'Kerjakan satu langkah kecil setiap kali dan cocokkan hasil akhirnya dengan pilihan jawaban yang tersedia.';
};

const buildArithmeticExplanation = (question) => {
  const analysis = evaluateArithmeticExpression(question.text);
  const answerSummary = getAnswerSummary(question);

  let step1;
  if (analysis.prioritySteps.length > 0) {
    const initialExpression = stripQuestionNumber(question.text).replace(/\s*=\s*\.\.\.\s*$/, '').replace(/x/g, '×').replace(/\//g, ':').trim();
    step1 = `Mulai dari ${initialExpression}. Kerjakan dulu operasi perkalian atau pembagian: ${analysis.prioritySteps.join(', lalu ')}. Setelah itu bentuk soalnya menjadi ${analysis.afterPriority}.`;
  } else {
    step1 = `Tidak ada perkalian atau pembagian yang harus didahulukan. Kerjakan dari kiri ke kanan: ${analysis.linearSteps[0]}.`;
  }

  const remainingSteps = analysis.prioritySteps.length > 0 ? analysis.linearSteps : analysis.linearSteps.slice(1);
  const step2Core = remainingSteps.length > 0
    ? `Lanjutkan operasi yang tersisa: ${remainingSteps.join(', lalu ')}.`
    : `Setelah langkah tadi, hasil akhirnya langsung ${analysis.result}.`;
  const step2 = `${step2Core} ${answerSummary}`;

  return makeExplanation(
    step1,
    step2,
    getArithmeticWhy(analysis),
    getArithmeticTip(question.text, analysis)
  );
};

// Generator Pembahasan Otomatis untuk Tes 2 dan Tes 5
const explainLetters = (text, ans) => {
  try {
    const [left, right] = text.split(' = ');
    const parts = left.split(' x ');
    if (parts.length !== 2) {
      return makeExplanation(
        'Ubah dulu setiap huruf ke angka sesuai kunci A=1 sampai K=0.',
        `Kerjakan perkaliannya, lalu bandingkan dengan hasil yang tertulis di soal. Dari perbandingan itu, jawabannya adalah ${ans === 'b' ? 'BENAR' : 'SALAH'}.`,
        'Pada soal huruf-angka, huruf hanyalah pengganti digit. Karena itu prosesnya tetap sama seperti perkalian biasa.',
        'Bila menemukan A, nilainya 1 sehingga angka tidak berubah. Bila menemukan K, nilainya 0 sehingga hasil kali yang melibatkan nol langsung 0.'
      );
    }
    
    const p1 = parts[0].trim();
    const p2 = parts[1].trim();
    const r = right.trim();

    const v1 = getVal(p1);
    const v2 = getVal(p2);
    const vr = getVal(r);
    const correctResult = v1 * v2;
    const correctLetters = toLetters(correctResult);

    const step1 = `${p1} dibaca ${v1} dan ${p2} dibaca ${v2}. Kalikan seperti angka biasa: ${v1} × ${v2} = ${correctResult}.`;
    const step2 = ans === 'b'
      ? `Hasil ${correctResult} jika diubah kembali ke huruf menjadi ${correctLetters}. Karena di soal juga tertulis ${r}, pernyataan ini BENAR.`
      : `Hasil ${correctResult} seharusnya ditulis ${correctLetters}. Di soal tertulis ${r} yang bernilai ${vr}, jadi pernyataan ini SALAH.`;

    return makeExplanation(
      step1,
      step2,
      'Cara kerjanya selalu sama: ubah huruf menjadi digit, kerjakan perkalian, lalu ubah hasilnya kembali ke huruf untuk dibandingkan.',
      (p1.includes('A') || p2.includes('A') || r.includes('A') || p1.includes('K') || p2.includes('K') || r.includes('K'))
        ? 'A berarti 1 dan K berarti 0. Ini sering mempercepat hitungan karena kali 1 tidak mengubah nilai dan kali 0 langsung menghasilkan 0.'
        : 'Untuk dua huruf seperti AB atau CE, bacalah sebagai angka dua digit berurutan, bukan dijumlahkan.'
    );
  } catch(e) {
    return makeExplanation(
      'Ubah dulu setiap huruf ke angka sesuai kunci A=1 sampai K=0.',
      `Kerjakan perkaliannya, lalu bandingkan dengan hasil yang tertulis di soal. Dari perbandingan itu, jawabannya adalah ${ans === 'b' ? 'BENAR' : 'SALAH'}.`,
      'Pada soal huruf-angka, huruf hanyalah pengganti digit. Karena itu prosesnya tetap sama seperti perkalian biasa.',
      'Bacalah dua huruf sebagai satu bilangan dua digit, misalnya AB = 12 dan AF = 16.'
    );
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

const buildNumericInput = (data, startIndex = 1) => data.map((d, i) => ({
  id: `q${startIndex + i}`,
  text: `${startIndex + i}) ${d[0]}`,
  answerType: 'numeric_input',
  correctAnswer: d[1],
  explanation: d[2]
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

const tb1_data = [
  ["Jika seorang anak memiliki 50 rupiah dan memberikan 15 rupiah kepada orang lain, berapa rupiahkah yang masih tinggal padanya?", 35, makeExplanation(
    "Uang awal 50 rupiah lalu diberikan 15 rupiah, jadi operasi yang dipakai adalah pengurangan.",
    "50 - 15 = 35. Ketik jawaban: 35.",
    "Karena ada uang yang keluar dari jumlah awal, maka nilainya berkurang.",
    "Kurangi cepat dengan memecah 15 menjadi 10 lalu 5: 50 - 10 = 40, 40 - 5 = 35."
  )],
  ["Berapa km-kah yang dapat ditempuh oleh kereta api dalam waktu 7 jam, jika kecepatannya 40 km/jam?", 280, makeExplanation(
    "Gunakan rumus jarak = kecepatan x waktu.",
    "40 x 7 = 280. Ketik jawaban: 280.",
    "Kecepatan sudah per jam, jadi untuk 7 jam tinggal dikalikan 7.",
    "40 x 7 bisa dihitung sebagai 4 x 7 = 28 lalu tambah satu nol jadi 280."
  )],
  ["15 peti buah-buahan beratnya 250 kg dan setiap peti kosong beratnya 3 kg, berapakah berat buah-buahan itu?", 205, makeExplanation(
    "Cari dulu total berat peti kosong: 15 x 3 = 45 kg.",
    "Berat buah = 250 - 45 = 205. Ketik jawaban: 205.",
    "Berat 250 kg adalah gabungan peti + buah, jadi berat peti harus dikurangkan.",
    "Untuk soal bruto-netto seperti ini, selalu pisahkan dulu berat wadahnya."
  )],
  ["Seseorang mempunyai persediaan rumput yang cukup untuk 7 ekor kuda selama 78 hari. Berapa harikah persediaan itu cukup untuk 21 ekor kuda?", 26, makeExplanation(
    "Hitung total kapasitas dalam satuan kuda-hari: 7 x 78 = 546 kuda-hari.",
    "Untuk 21 kuda, lama hari = 546 : 21 = 26. Ketik jawaban: 26.",
    "Jumlah persediaan tetap, jadi perkalian jumlah kuda x hari harus konstan.",
    "Saat jumlah hewan naik 3 kali (7 ke 21), lama hari turun 3 kali (78 ke 26)."
  )],
  ["3 batang coklat harganya Rp 5,- Berapa batangkah yang dapat kita beli dengan Rp 50,-?", 30, makeExplanation(
    "Bandingkan uang 50 terhadap paket harga 5: 50 : 5 = 10 paket.",
    "Setiap paket berisi 3 batang, jadi total batang = 10 x 3 = 30. Ketik jawaban: 30.",
    "Karena harga diberikan per 3 batang, hitung jumlah paket dulu, baru konversi ke batang.",
    "Kalau 5 rupiah dapat 3 batang, maka 50 rupiah (10 kali lipat) juga memberi 10 kali lipat batang."
  )],
  ["Seseorang dapat berjalan 1,75 m dalam waktu 1/4 detik. Berapakah meterkah yang dapat ia tempuh dalam waktu 10 detik?", 70, makeExplanation(
    "Kecepatan per detik = 1,75 : 0,25 = 7 meter/detik.",
    "Dalam 10 detik, jarak = 7 x 10 = 70. Ketik jawaban: 70.",
    "Dari data sebagian detik, ubah dulu ke laju per 1 detik supaya mudah.",
    "Membagi 0,25 sama dengan mengalikan 4, jadi 1,75 x 4 = 7."
  )],
  ["Jika sebuah batu terletak 15 m di sebelah selatan dari sebatang pohon dan pohon itu berada 30 m di sebelah selatan dari sebuah rumah, berapa meterkah jarak antara batu dan rumah itu?", 45, makeExplanation(
    "Batu 15 m di selatan pohon, dan pohon 30 m di selatan rumah.",
    "Karena searah (sama-sama ke selatan), jarak batu ke rumah = 15 + 30 = 45. Ketik jawaban: 45.",
    "Jika posisi berada pada arah yang sama, jaraknya dijumlahkan.",
    "Bayangkan garis lurus utara-selatan untuk menghindari salah operasi."
  )],
  ["Jika 4 1/2 m bahan sandang harganya Rp 90,- berapakah rupiahkah harganya 2 1/2 m?", 50, makeExplanation(
    "Cari harga per meter: 90 : 4,5 = 20.",
    "Harga 2,5 meter = 20 x 2,5 = 50. Ketik jawaban: 50.",
    "Harga berbanding lurus dengan panjang bahan.",
    "Ubah 4,5 menjadi pecahan 9/2 jika lebih nyaman: 90 : (9/2) = 20."
  )],
  ["7 orang dapat menyelesaikan sesuatu pekerjaan dalam 6 hari. Berapa orangkah yang diperlukan untuk menyelesaikan pekerjaan itu dalam setengah hari?", 84, makeExplanation(
    "Total pekerjaan = 7 x 6 = 42 orang-hari.",
    "Jika waktu hanya 0,5 hari, orang yang dibutuhkan = 42 : 0,5 = 84. Ketik jawaban: 84.",
    "Untuk pekerjaan tetap, orang x hari bernilai konstan.",
    "Membagi dengan 0,5 sama dengan mengalikan 2."
  )],
  ["Karena dipanaskan, kawat yang panjangnya 48 cm akan mengembang menjadi 52 cm. setelah pemanasan, berapakah panjangnya kawat yang berukuran 72 cm?", 78, makeExplanation(
    "Faktor pemuaian = 52 : 48 = 13/12.",
    "Panjang baru untuk 72 cm = 72 x 13/12 = 78. Ketik jawaban: 78.",
    "Semua panjang kawat bertambah dengan rasio yang sama.",
    "Karena 72 : 12 = 6, hitung cepat: 6 x 13 = 78."
  )],
  ["Suatu pabrik dapat menghasilkan 304 batang pensil dalam waktu 8 jam. Berapa batangkah dihasilkan dalam waktu setengah jam?", 19, makeExplanation(
    "Produksi per jam = 304 : 8 = 38 batang.",
    "Dalam 0,5 jam hasilnya 38 x 0,5 = 19. Ketik jawaban: 19.",
    "Setengah jam berarti setengah dari produksi 1 jam.",
    "Setelah dapat angka per jam, cukup dibagi 2 untuk setengah jam."
  )],
  ["Untuk suatu campuran diperlukan 2 bagian perak dan 3 bagian timah. Berapa gramkah perak yang diperlukan untuk mendapatkan campuran itu yang beratnya 15 gram?", 6, makeExplanation(
    "Total bagian campuran = 2 + 3 = 5 bagian.",
    "Perak = 2/5 x 15 = 6 gram. Ketik jawaban: 6.",
    "Komposisi campuran mengikuti perbandingan bagian terhadap total bagian.",
    "Jika total 15 dibagi 5, tiap bagian = 3 gram; perak 2 bagian berarti 6 gram."
  )],
  ["Untuk setiap Rp 3,- yang dimiliki Sidin, Hamid memiliki Rp 5,- Jika mereka bersama mempunyai Rp 120,- berapa rupiahkah yang dimiliki Hamid?", 75, makeExplanation(
    "Perbandingan Sidin:Hamid = 3:5, jadi total bagian = 8.",
    "Nilai 1 bagian = 120 : 8 = 15, maka uang Hamid = 5 x 15 = 75. Ketik jawaban: 75.",
    "Pada soal rasio, cari nilai per bagian dulu baru kalikan sesuai bagian pihak yang ditanya.",
    "Gunakan pola tetap: jumlahkan rasio -> bagi total -> kalikan rasio target."
  )],
  ["Mesin A menenun 60 m kain, sedangkan mesin B menenun 40 m. berapa meterkah yang ditenun mesin A, jika mesin B menenun 60 m?", 90, makeExplanation(
    "Rasio hasil A:B = 60:40 = 3:2.",
    "Jika B = 60, maka A = 60 x (3/2) = 90. Ketik jawaban: 90.",
    "Kinerja mesin dianggap tetap, sehingga perbandingan output tetap sama.",
    "Saat B naik dari 40 ke 60 (naik 1,5 kali), A juga naik 1,5 kali: 60 x 1,5 = 90."
  )],
  ["Seseorang membelikan 1/10 dari uangnya untuk perangko dan 4 kali jumlah itu untuk alat tulis. Sisa uangnya masih Rp 60,- Berapa rupiahkah uang semula?", 120, makeExplanation(
    "Untuk perangko dipakai 1/10 uang. Untuk alat tulis dipakai 4 x (1/10) = 4/10.",
    "Total dipakai 5/10 = 1/2, berarti sisa 1/2 = 60. Jadi uang semula 120. Ketik jawaban: 120.",
    "Kunci soal ini adalah mengubah semua pengeluaran menjadi pecahan dari total uang.",
    "Kalau sisa setengah adalah 60, totalnya tinggal dikali 2."
  )],
  ["Di dalam dua peti terdapat 43 piring. Di dalam peti yang satu terdapat 9 piring lebih banyak dari pada di dalam peti yang lain. Berapa buah piring terdapat di dalam peti yang lebih kecil?", 17, makeExplanation(
    "Misal peti kecil = x, maka peti besar = x + 9.",
    "x + (x + 9) = 43 -> 2x = 34 -> x = 17. Ketik jawaban: 17.",
    "Model aljabar sederhana membantu memisahkan nilai kecil dan selisihnya.",
    "Cara cepat: dari total 43, kurangi selisih 9 jadi 34, lalu bagi dua."
  )],
  ["Suatu lembaran kain yang panjangnya 60 cm harus dibagikan sedemikian rupa sehingga panjangnya satu bagian ialah 2/3 dari bagian yang lain. Berapa panjangnya bagian yang terpendek.", 24, makeExplanation(
    "Bagian pendek : bagian panjang = 2 : 3, total rasio = 5 bagian.",
    "Satu bagian = 60 : 5 = 12, maka bagian terpendek = 2 x 12 = 24. Ketik jawaban: 24.",
    "Karena satu bagian 2/3 dari yang lain, perbandingannya langsung bisa ditulis 2:3.",
    "Ubah kalimat pecahan ke bentuk rasio agar hitungannya lebih cepat."
  )],
  ["Suatu perusahaan mengekspor 3/4 dari hasil produksinya dan menjual 4/5 dari sisa itu dalam negeri. Berapa % kah hasil produksi yang masih tinggal?", 5, makeExplanation(
    "Setelah ekspor 3/4, sisa produksi = 1/4.",
    "Dari sisa itu dijual 4/5, berarti tersisa 1/5 x 1/4 = 1/20 = 5%. Ketik jawaban: 5.",
    "Penjualan kedua dihitung dari sisa, bukan dari total awal.",
    "Untuk berantai pecahan, kalikan pecahan sisanya secara langsung."
  )],
  ["Jika suatu botol berisi anggur hanya 7/8 bagian dan harganya ialah Rp 84,- berapakah harga anggur itu jika botol itu hanya terisi 1/2 penuh?", 48, makeExplanation(
    "Harga 7/8 botol adalah 84, maka harga 1 botol penuh = 84 x (8/7) = 96.",
    "Harga 1/2 botol = 96 x 1/2 = 48. Ketik jawaban: 48.",
    "Nilai anggur sebanding dengan isi botol, jadi gunakan perbandingan volume.",
    "Cari harga penuh dulu saat soal memberi harga untuk isi pecahan."
  )],
  ["Di dalam suatu keluarga setiap anak perempuan mempunyai jumlah saudara laki-laki yang sama dengan jumlah saudara perempuan dan setiap anak laki-laki mempunyai dua kali lebih banyak saudara perempuan dari pada saudara laki-laki. Berapa anak laki-lakikah yang terdapat di dalam keluarga tersebut?", 3, makeExplanation(
    "Misal anak laki-laki = L dan perempuan = P. Untuk seorang anak perempuan: L = P - 1.",
    "Untuk seorang anak laki-laki: P = 2(L - 1). Substitusi memberi L = 3. Ketik jawaban: 3.",
    "Jumlah saudara dihitung dari sudut pandang satu anak, sehingga dirinya sendiri tidak ikut dihitung.",
    "Tulis dua persamaan sederhana dari dua kalimat soal, lalu selesaikan substitusi."
  )]
];

const tb1_questions = buildNumericInput(tb1_data, 77);

const tb2_data = [
  ["6, 9, 12, 15, 18, 21, 24, ?", 27, makeExplanation(
    "Deret bertambah tetap +3 setiap langkah.",
    "24 + 3 = 27. Ketik jawaban: 27.",
    "Jika selisih antarangka konstan, pola deretnya adalah aritmetika sederhana.",
    "Cek dua selisih terakhir; kalau sama, biasanya langkah berikut tetap sama."
  )],
  ["15, 16, 18, 19, 21, 22, 24, ?", 25, makeExplanation(
    "Pola selang-seling: +1 lalu +2, berulang.",
    "Setelah 24, langkah berikutnya adalah +1, jadi 25. Ketik jawaban: 25.",
    "Urutan operasi tidak tunggal, tetapi pola berulang dua langkah.",
    "Untuk pola selang-seling, kelompokkan jadi pasangan operasi."
  )],
  ["19, 18, 22, 21, 25, 24, 28, ?", 27, makeExplanation(
    "Pola selang-seling: -1 lalu +4, berulang.",
    "Setelah 28, operasi berikutnya -1, jadi 27. Ketik jawaban: 27.",
    "Deret campuran sering memakai dua operasi yang diulang bergantian.",
    "Pisahkan ke langkah ganjil-genap agar pola lebih cepat terlihat."
  )],
  ["16, 12, 17, 13, 18, 14, 19, ?", 15, makeExplanation(
    "Pola berulang: -4 lalu +5.",
    "Setelah 19, kembali ke -4 sehingga 19 - 4 = 15. Ketik jawaban: 15.",
    "Urutannya konsisten dua operasi, jadi lanjutkan siklus yang sama.",
    "Cara lain: lihat dua deret kecil, posisi ganjil naik, posisi genap juga naik."
  )],
  ["2, 4, 8, 10, 20, 22, 44, ?", 46, makeExplanation(
    "Pola berulang: x2 lalu +2.",
    "Setelah 44, giliran +2 sehingga menjadi 46. Ketik jawaban: 46.",
    "Deret ini menggabungkan operasi kali dan tambah secara bergantian.",
    "Jika ada lonjakan besar lalu kecil, cek kemungkinan pola kali-tambah berulang."
  )],
  ["15, 13, 16, 12, 17, 11, 18, ?", 10, makeExplanation(
    "Pola selang-seling: -2, +3, -4, +5, -6, +7, ...",
    "Langkah berikutnya adalah -8, jadi 18 - 8 = 10. Ketik jawaban: 10.",
    "Besar langkah berubah teratur dan tanda operasi berganti.",
    "Lacak nilai selisihnya dulu (2,3,4,5,...) baru tentukan tanda +/-."
  )],
  ["25, 22, 11, 33, 30, 15, 45, ?", 42, makeExplanation(
    "Pola tiga langkah: -3, :2, x3.",
    "Setelah 45, kembali ke -3, sehingga 45 - 3 = 42. Ketik jawaban: 42.",
    "Deret ini tidak linear; operasi periodik tiga langkah lebih cocok.",
    "Kalau angka kadang membesar drastis dan kadang mengecil, cek pola multi-operasi."
  )],
  ["49, 51, 54, 27, 9, 11, 14, ?", 7, makeExplanation(
    "Pola berulang: +2, +3, :2, :3.",
    "Setelah 14, urutan kembali ke :2, jadi 14 : 2 = 7. Ketik jawaban: 7.",
    "Empat operasi diputar berulang dalam urutan tetap.",
    "Uji apakah operasi besar-kecil muncul periodik setiap 4 langkah."
  )],
  ["2, 3, 1, 3, 4, 2, 4, ?", 5, makeExplanation(
    "Pola berulang: +1, -2, +2.",
    "Setelah 4, langkah berikut +1, jadi 5. Ketik jawaban: 5.",
    "Urutan operasi tiga langkah yang sama diulang terus.",
    "Tuliskan operatornya di bawah deret agar pola siklik cepat terbaca."
  )],
  ["19, 17, 20, 16, 21, 15, 22, ?", 14, makeExplanation(
    "Pisah jadi dua deret: posisi ganjil 19,20,21,22 dan posisi genap 17,16,15,?",
    "Deret genap turun 1 setiap langkah, jadi setelah 15 adalah 14. Ketik jawaban: 14.",
    "Banyak deret campuran lebih mudah diselesaikan jika dipisah ganjil-genap.",
    "Langsung cek suku ke-1,3,5,7 lalu 2,4,6,8."
  )],
  ["94, 92, 46, 44, 22, 20, 10, ?", 8, makeExplanation(
    "Pola berulang: -2 lalu :2.",
    "Setelah 10, giliran -2 sehingga hasilnya 8. Ketik jawaban: 8.",
    "Setiap dua langkah nilai dikurangi lalu dibagi dua secara konsisten.",
    "Saat ada pola turun cepat, coba kombinasi kurang tetap dan bagi tetap."
  )],
  ["5, 8, 9, 8, 11, 12, 11, ?", 14, makeExplanation(
    "Pola berulang: +3, +1, -1.",
    "Setelah 11, kembali ke +3 sehingga 14. Ketik jawaban: 14.",
    "Tiga langkah operasi yang sama diulang dari awal.",
    "Bandingkan blok 3 angka: (5,8,9), (8,11,12), lalu lanjut blok berikut."
  )],
  ["12, 15, 19, 23, 28, 33, 39, ?", 45, makeExplanation(
    "Selisih bertambah: +3, +4, +4, +5, +5, +6, ...",
    "Setelah +6 pertama, pola mengulang +6 lagi, jadi 39 + 6 = 45. Ketik jawaban: 45.",
    "Pola selisih sendiri membentuk urutan teratur.",
    "Saat nilai naik stabil, fokus pada deret selisih antar-suku."
  )],
  ["7, 5, 10, 7, 21, 17, 68, ?", 63, makeExplanation(
    "Pola berulang: -2, x2, -3, x3, -4, x4, ...",
    "Setelah 68, operasi berikutnya -5 sehingga 63. Ketik jawaban: 63.",
    "Besar pengurang dan pengali naik bertahap mengikuti urutan 2,3,4,5.",
    "Perhatikan pasangan operasi: satu kecil (kurang), satu besar (kali)."
  )],
  ["11, 15, 18, 9, 13, 16, 8, ?", 12, makeExplanation(
    "Pola berulang: +4, +3, :2.",
    "Setelah 8, kembali ke +4 sehingga 12. Ketik jawaban: 12.",
    "Deret memakai tiga operasi periodik yang berulang sama persis.",
    "Tes pola 3-langkah saat terlihat ada fase naik lalu turun tajam."
  )],
  ["3, 8, 15, 24, 35, 48, 63, ?", 80, makeExplanation(
    "Selisih berturut: +5, +7, +9, +11, +13, +15.",
    "Selisih berikut +17, jadi 63 + 17 = 80. Ketik jawaban: 80.",
    "Deret selisih adalah bilangan ganjil berurutan.",
    "Bisa juga dikenali sebagai pola n^2 - 1."
  )],
  ["4, 5, 7, 4, 8, 13, 7, ?", 14, makeExplanation(
    "Pola berulang: +1, +2, -3, +4, +5, -6, +7, ...",
    "Setelah 13 turun 6 menjadi 7, langkah berikutnya naik 7 sehingga 7 + 7 = 14. Ketik jawaban: 14.",
    "Nilai perubahan naik 1 per langkah, dengan tanda minus setiap langkah ke-3.",
    "Tuliskan deret perubahan dulu: +1,+2,-3,+4,+5,-6,+7,... agar tidak salah."
  )],
  ["8, 5, 15, 18, 6, 3, 9, ?", 12, makeExplanation(
    "Pola berulang: -3, x3, +3, :3.",
    "Setelah 9, giliran +3 sehingga 12. Ketik jawaban: 12.",
    "Empat operasi diulang konsisten sepanjang deret.",
    "Ketika ada kali dan bagi angka sama, cek siklus operasi 4 langkah."
  )],
  ["15, 6, 18, 10, 30, 23, 69, ?", 63, makeExplanation(
    "Pola berulang: -9, x3, -8, x3, -7, x3, ...",
    "Setelah 69, operasi berikutnya -6 sehingga 63. Ketik jawaban: 63.",
    "Nilai pengurang naik mendekati nol: 9,8,7,6 sementara pengali tetap 3.",
    "Kelompokkan sebagai pasangan (kurang, kali) agar pola cepat terlihat."
  )],
  ["5, 35, 28, 4, 11, 77, 70, ?", 10, makeExplanation(
    "Pola berulang: x7, -7, :7, +7.",
    "Setelah 70, urutan kembali ke :7, jadi 70 : 7 = 10. Ketik jawaban: 10.",
    "Empat operasi membentuk siklus tetap yang berulang.",
    "Cari operasi yang mengembalikan skala angka (kali lalu bagi angka sama)."
  )]
];

const tb2_questions = buildNumericInput(tb2_data, 97);

const tb3_data = [
  ["Seorang siswa memiliki 80 rupiah lalu memberikan 27 rupiah kepada temannya. Berapa rupiah sisa uangnya?", 53, makeExplanation(
    "Uang awal 80 dikurangi uang yang diberikan 27.",
    "80 - 27 = 53. Ketik jawaban: 53.",
    "Karena uang keluar dari jumlah awal, operasi yang tepat adalah pengurangan.",
    "Kurangi bertahap: 80 - 20 = 60, lalu 60 - 7 = 53."
  )],
  ["Sebuah mobil melaju dengan kecepatan 45 km/jam selama 6 jam. Berapa jarak yang ditempuh?", 270, makeExplanation(
    "Gunakan rumus jarak = kecepatan x waktu.",
    "45 x 6 = 270. Ketik jawaban: 270.",
    "Kecepatan sudah dalam satuan per jam, jadi untuk 6 jam tinggal dikalikan.",
    "40 x 6 = 240 dan 5 x 6 = 30, lalu jumlahkan jadi 270."
  )],
  ["18 peti buah total beratnya 324 kg. Jika setiap peti kosong beratnya 4 kg, berapa berat buahnya saja?", 252, makeExplanation(
    "Hitung total berat peti kosong: 18 x 4 = 72 kg.",
    "Berat buah = 324 - 72 = 252. Ketik jawaban: 252.",
    "Berat total adalah gabungan peti dan buah, jadi berat peti harus dikurangi.",
    "Soal bruto-netto selalu dikerjakan dengan memisahkan berat wadah terlebih dulu."
  )],
  ["Persediaan pakan cukup untuk 9 kambing selama 56 hari. Berapa hari cukup untuk 21 kambing?", 24, makeExplanation(
    "Total kapasitas pakan = 9 x 56 = 504 kambing-hari.",
    "Untuk 21 kambing: 504 : 21 = 24. Ketik jawaban: 24.",
    "Jumlah pakan tetap, jadi hasil kali jumlah kambing dan hari tetap sama.",
    "Saat jumlah hewan naik, lama hari turun sebanding."
  )],
  ["4 buku harganya Rp 12,-. Dengan Rp 96,- kita bisa membeli berapa buku?", 32, makeExplanation(
    "Harga per buku = 12 : 4 = 3 rupiah.",
    "Jumlah buku = 96 : 3 = 32. Ketik jawaban: 32.",
    "Setelah harga satuan ditemukan, jumlah barang tinggal total uang dibagi harga satuan.",
    "Bisa juga pakai skala: 96 adalah 8 kali 12, maka buku juga 8 kali 4."
  )],
  ["Seseorang berjalan 2,4 meter dalam 0,3 detik. Berapa meter yang ditempuh dalam 9 detik?", 72, makeExplanation(
    "Kecepatan per detik = 2,4 : 0,3 = 8 meter/detik.",
    "Dalam 9 detik: 8 x 9 = 72. Ketik jawaban: 72.",
    "Waktu harus disamakan ke 1 detik dulu agar mudah dikalikan.",
    "Membagi 0,3 bisa dipercepat dengan mengalikan 10 lebih dulu."
  )],
  ["Sebuah batu 22 m di sebelah timur pohon, dan pohon 18 m di sebelah timur rumah. Berapa jarak batu ke rumah?", 40, makeExplanation(
    "Keduanya berada pada arah yang sama (timur), jadi jarak dijumlahkan.",
    "22 + 18 = 40. Ketik jawaban: 40.",
    "Jika posisi segaris dan searah, jarak total adalah penjumlahan segmen.",
    "Gambar garis posisi sederhana untuk menghindari salah tanda."
  )],
  ["Jika 5 meter kain harganya Rp 125,-, berapa harga 3 meter kain?", 75, makeExplanation(
    "Harga per meter = 125 : 5 = 25 rupiah.",
    "Harga 3 meter = 25 x 3 = 75. Ketik jawaban: 75.",
    "Harga kain berbanding lurus dengan panjang kain.",
    "Cari harga per 1 meter dulu agar soal proporsi cepat selesai."
  )],
  ["8 orang menyelesaikan pekerjaan dalam 9 hari. Berapa orang diperlukan agar selesai dalam 3 hari?", 24, makeExplanation(
    "Total pekerjaan = 8 x 9 = 72 orang-hari.",
    "Jika waktunya 3 hari, orang yang diperlukan = 72 : 3 = 24. Ketik jawaban: 24.",
    "Untuk pekerjaan tetap, orang x hari konstan.",
    "Waktu diperkecil 3 kali, maka jumlah orang harus diperbesar 3 kali."
  )],
  ["Kawat 60 cm memanjang jadi 66 cm setelah dipanaskan. Jika panjang awal 90 cm, berapa panjang setelah dipanaskan?", 99, makeExplanation(
    "Faktor pemuaian = 66 : 60 = 1,1.",
    "Panjang baru = 90 x 1,1 = 99. Ketik jawaban: 99.",
    "Perubahan dianggap proporsional, jadi semua panjang dikali faktor yang sama.",
    "Jika naik 10%, cukup tambah 10% dari nilai awal."
  )],
  ["Sebuah pabrik membuat 420 pensil dalam 7 jam. Berapa pensil dihasilkan dalam 1/4 jam?", 15, makeExplanation(
    "Produksi per jam = 420 : 7 = 60 pensil.",
    "Dalam 1/4 jam: 60 x 1/4 = 15. Ketik jawaban: 15.",
    "Hitung laju per jam dulu, lalu kalikan dengan pecahan waktu.",
    "Seperempat jam berarti bagi 4 dari hasil per jam."
  )],
  ["Campuran terdiri dari 3 bagian tembaga dan 5 bagian seng. Jika total campuran 40 gram, berapa gram tembaga?", 15, makeExplanation(
    "Total bagian = 3 + 5 = 8 bagian.",
    "Tembaga = 3/8 x 40 = 15. Ketik jawaban: 15.",
    "Komponen campuran dihitung dari proporsi bagian terhadap total bagian.",
    "Setelah tahu 1 bagian = 5 gram, tinggal kalikan 3."
  )],
  ["Perbandingan uang Dito dan Eko adalah 4 : 7. Jika total uang mereka Rp 220,-, berapa uang Eko?", 140, makeExplanation(
    "Total bagian = 4 + 7 = 11 bagian.",
    "Nilai 1 bagian = 220 : 11 = 20, jadi uang Eko = 7 x 20 = 140. Ketik jawaban: 140.",
    "Soal perbandingan diselesaikan dengan metode nilai per bagian.",
    "Langkah cepat: jumlah rasio, bagi total, lalu kalikan bagian target."
  )],
  ["Mesin A menghasilkan 84 meter kain ketika mesin B menghasilkan 56 meter. Jika mesin B menghasilkan 98 meter, berapa hasil mesin A?", 147, makeExplanation(
    "Rasio A:B = 84:56 = 3:2.",
    "Jika B = 98, maka A = 98 x 3/2 = 147. Ketik jawaban: 147.",
    "Kinerja mesin dianggap tetap, sehingga rasio output tetap sama.",
    "Ubah rasio ke bentuk paling sederhana sebelum menghitung."
  )],
  ["Seseorang menggunakan 1/8 uangnya untuk pulsa dan 3 kali jumlah itu untuk transport. Jika sisa uang Rp 90,-, berapa uang semula?", 180, makeExplanation(
    "Pulsa = 1/8, transport = 3/8, total dipakai = 4/8 = 1/2.",
    "Sisa 1/2 uang = 90, jadi uang semula = 180. Ketik jawaban: 180.",
    "Semua pengeluaran harus diubah ke pecahan dari total uang.",
    "Jika sisa setengah diketahui, total tinggal dikali 2."
  )],
  ["Dalam dua keranjang ada 58 apel. Satu keranjang berisi 12 apel lebih banyak dari yang lain. Berapa apel di keranjang yang lebih sedikit?", 23, makeExplanation(
    "Misal keranjang kecil = x, maka keranjang besar = x + 12.",
    "x + (x + 12) = 58 -> 2x = 46 -> x = 23. Ketik jawaban: 23.",
    "Model persamaan satu variabel paling tepat untuk total + selisih.",
    "Cara cepat: (58 - 12) : 2 = 23."
  )],
  ["Sebuah pita panjang 84 cm dibagi menjadi dua bagian, bagian pendek adalah 3/4 dari bagian panjang. Berapa panjang bagian pendek?", 36, makeExplanation(
    "Rasio pendek:panjang = 3:4, total rasio 7 bagian.",
    "Satu bagian = 84 : 7 = 12, bagian pendek = 3 x 12 = 36. Ketik jawaban: 36.",
    "Kalimat “3/4 dari bagian lain” langsung bisa diubah ke rasio 3:4.",
    "Rasio membuat pembagian panjang lebih cepat dibanding coba-coba."
  )],
  ["Perusahaan mengekspor 4/5 produksi, lalu menjual 3/4 dari sisanya. Berapa persen produksi yang masih tersisa?", 5, makeExplanation(
    "Setelah ekspor, sisa = 1/5.",
    "Yang tersisa lagi setelah dijual 3/4 adalah 1/4 x 1/5 = 1/20 = 5%. Ketik jawaban: 5.",
    "Langkah kedua berlaku pada sisa, bukan pada total awal.",
    "Untuk proses berantai, kalikan pecahan sisa langsung."
  )],
  ["Jika 3/4 botol sirup harganya Rp 96,-, berapa harga sirup bila isi botol 1/2 penuh?", 64, makeExplanation(
    "Harga botol penuh = 96 x (4/3) = 128.",
    "Harga 1/2 botol = 128 x 1/2 = 64. Ketik jawaban: 64.",
    "Nilai isi berbanding lurus dengan volume isi botol.",
    "Cari harga penuh dulu saat diketahui harga isi pecahan."
  )],
  ["Dalam suatu keluarga, setiap anak perempuan punya saudara laki-laki dua kali jumlah saudara perempuan. Setiap anak laki-laki punya jumlah saudara perempuan sama dengan saudara laki-laki. Berapa jumlah anak laki-laki?", 4, makeExplanation(
    "Misal laki-laki = L, perempuan = P. Untuk seorang perempuan: L = 2(P - 1).",
    "Untuk seorang laki-laki: P = L - 1. Substitusi memberi L = 4. Ketik jawaban: 4.",
    "Jumlah saudara dilihat dari sudut pandang tiap anak, jadi diri sendiri tidak dihitung.",
    "Ubah dua kalimat soal menjadi dua persamaan, lalu selesaikan substitusi."
  )]
];

const tb3_questions = buildNumericInput(tb3_data, 117);

const tb4_data = [
  ["8, 12, 16, 20, 24, 28, 32, ?", 36, makeExplanation(
    "Selisih deret tetap +4.",
    "32 + 4 = 36. Ketik jawaban: 36.",
    "Deret aritmetika memiliki beda konstan antar suku.",
    "Cek tiga selisih terakhir untuk memastikan beda tetap."
  )],
  ["14, 16, 19, 21, 24, 26, 29, ?", 31, makeExplanation(
    "Pola selang-seling +2 lalu +3.",
    "Setelah 29, giliran +2 sehingga hasil 31. Ketik jawaban: 31.",
    "Deret ini tidak naik tetap, tetapi memiliki pola operasi berulang dua langkah.",
    "Tuliskan operator di bawah deret: +2, +3, +2, +3, ..."
  )],
  ["23, 21, 26, 24, 29, 27, 32, ?", 30, makeExplanation(
    "Pola selang-seling -2 lalu +5.",
    "Setelah 32, operasi berikutnya -2 sehingga 30. Ketik jawaban: 30.",
    "Pola campuran sering berganti antara turun kecil dan naik lebih besar.",
    "Pisah suku ganjil-genap untuk verifikasi cepat."
  )],
  ["20, 15, 21, 16, 22, 17, 23, ?", 18, makeExplanation(
    "Pola berulang -5 lalu +6.",
    "Setelah 23 kembali ke -5, jadi 18. Ketik jawaban: 18.",
    "Urutan operasi periodik dua langkah membuat deret stabil.",
    "Gunakan blok pasangan nilai agar tidak tertukar urutan operasi."
  )],
  ["1, 3, 4, 12, 13, 39, 40, ?", 120, makeExplanation(
    "Pola berulang x3 lalu +1.",
    "Setelah 40, operasi berikut x3 sehingga 120. Ketik jawaban: 120.",
    "Lompatan besar menandakan operasi kali, lalu diselingi kenaikan kecil.",
    "Cari pasangan (kali, tambah) saat pola terlihat zig-zag besar-kecil."
  )],
  ["18, 15, 19, 14, 20, 13, 21, ?", 12, makeExplanation(
    "Pola bertanda selang-seling: -3, +4, -5, +6, -7, +8, ...",
    "Langkah berikutnya -9, jadi 21 - 9 = 12. Ketik jawaban: 12.",
    "Besar perubahan naik 1 tiap langkah dengan tanda berganti.",
    "Tuliskan deret selisih dulu untuk menghindari salah tanda."
  )],
  ["30, 26, 13, 52, 48, 24, 96, ?", 92, makeExplanation(
    "Pola tiga langkah berulang: -4, :2, x4.",
    "Setelah 96 kembali ke -4 menjadi 92. Ketik jawaban: 92.",
    "Kombinasi operasi periodik lebih cocok daripada beda tetap.",
    "Saat ada pembagian lalu pengalian besar, cek siklus operasi 3 langkah."
  )],
  ["60, 58, 55, 53, 50, 48, 45, ?", 43, makeExplanation(
    "Selisih berulang -2 lalu -3.",
    "Setelah 45, giliran -2 menjadi 43. Ketik jawaban: 43.",
    "Deret turun dengan pola dua selisih bisa dilihat dari beda antar suku.",
    "Bandingkan pasangan beda: (-2, -3), (-2, -3), ..."
  )],
  ["10, 11, 8, 12, 13, 10, 14, ?", 15, makeExplanation(
    "Pola berulang +1, -3, +4.",
    "Setelah 14, operasi berikut +1, jadi 15. Ketik jawaban: 15.",
    "Operasi periodik tiga langkah menghasilkan ritme naik-turun.",
    "Kelompokkan dalam blok tiga perubahan."
  )],
  ["22, 19, 23, 18, 24, 17, 25, ?", 16, makeExplanation(
    "Pisahkan jadi dua deret: ganjil 22,23,24,25 dan genap 19,18,17,?.",
    "Deret genap turun 1, jadi suku berikutnya 16. Ketik jawaban: 16.",
    "Pemisahan ganjil-genap sering membuka pola yang tersembunyi.",
    "Uji cepat dengan melihat indeks 1,3,5,7 lalu 2,4,6,8."
  )],
  ["84, 80, 40, 36, 18, 14, 7, ?", 3, makeExplanation(
    "Pola berulang -4 lalu :2.",
    "Setelah 7, operasi berikut -4 sehingga 3. Ketik jawaban: 3.",
    "Deret menggunakan dua operasi tetap yang berulang.",
    "Saat ada pola turun tajam, cek kombinasi kurang tetap dan bagi tetap."
  )],
  ["4, 6, 8, 11, 13, 15, 18, ?", 20, makeExplanation(
    "Pola selisih: +2, +2, +3, berulang.",
    "Setelah 18, giliran +2 sehingga 20. Ketik jawaban: 20.",
    "Selisih periodik tiga langkah membentuk pola naik tidak konstan.",
    "Tulis beda antar suku untuk melihat siklus selisih."
  )],
  ["7, 11, 16, 22, 29, 37, 46, ?", 56, makeExplanation(
    "Selisih bertambah berurutan: +4, +5, +6, +7, +8, +9.",
    "Selisih berikut +10, jadi 46 + 10 = 56. Ketik jawaban: 56.",
    "Jika selisih naik satu-satu, deret utama mengikuti pola kuadratik.",
    "Fokus ke deret selisih saat angka tumbuh makin cepat."
  )],
  ["11, 10, 20, 19, 38, 37, 74, ?", 73, makeExplanation(
    "Pola berulang -1 lalu x2.",
    "Setelah 74, operasi berikut -1 sehingga 73. Ketik jawaban: 73.",
    "Polanya konsisten antara turun sedikit lalu lonjakan kali dua.",
    "Cari pasangan operasi kecil-besar yang berulang."
  )],
  ["5, 11, 9, 15, 13, 19, 17, ?", 23, makeExplanation(
    "Pola berulang +6 lalu -2.",
    "Setelah 17, operasi berikut +6 menjadi 23. Ketik jawaban: 23.",
    "Dua operasi tetap digunakan bergantian pada setiap langkah.",
    "Catat perubahan antar angka untuk memverifikasi cepat."
  )],
  ["3, 6, 5, 10, 9, 18, 17, ?", 34, makeExplanation(
    "Pola berulang x2 lalu -1.",
    "Setelah 17, giliran x2 menjadi 34. Ketik jawaban: 34.",
    "Pola ini menghasilkan pasangan angka yang dekat lalu lonjak.",
    "Uji dengan membandingkan tiap dua suku berturut."
  )],
  ["12, 19, 16, 23, 20, 27, 24, ?", 31, makeExplanation(
    "Pola berulang +7 lalu -3.",
    "Setelah 24, operasi berikut +7 sehingga 31. Ketik jawaban: 31.",
    "Deret naik-turun dengan dua langkah berulang.",
    "Pastikan urutan operator tidak tertukar saat melanjutkan."
  )],
  ["6, 10, 15, 21, 28, 36, 45, ?", 55, makeExplanation(
    "Selisih berurutan +4, +5, +6, +7, +8, +9.",
    "Selisih berikut +10, jadi 45 + 10 = 55. Ketik jawaban: 55.",
    "Deret ini mengikuti kenaikan selisih yang naik satu-satu.",
    "Cek pola pada beda antar suku, bukan pada suku langsung."
  )],
  ["4, 6, 12, 14, 28, 30, 60, ?", 62, makeExplanation(
    "Pola berulang +2 lalu x2.",
    "Setelah 60, giliran +2 sehingga 62. Ketik jawaban: 62.",
    "Lonjakan dua kali lipat diselingi penambahan kecil.",
    "Gunakan blok operasi 2 langkah agar konsisten."
  )],
  ["50, 45, 60, 55, 70, 65, 80, ?", 75, makeExplanation(
    "Pola berulang -5 lalu +15.",
    "Setelah 80, operasi berikut -5 sehingga 75. Ketik jawaban: 75.",
    "Deret membentuk ritme naik bersih setiap dua langkah.",
    "Saat ada pola naik besar lalu turun kecil, cek dua operator berulang."
  )]
];

const tb4_questions = buildNumericInput(tb4_data, 137);

const tb5_data = [
  ["Rani memiliki 95 rupiah lalu membayar 38 rupiah. Berapa sisa uang Rani?", 57, makeExplanation(
    "Uang awal dikurangi uang yang dibayar.",
    "95 - 38 = 57. Ketik jawaban: 57.",
    "Transaksi keluar selalu mengurangi jumlah awal.",
    "Kurangi bertahap: 95 - 30 = 65, lalu -8 = 57."
  )],
  ["Sebuah bus melaju 32 km/jam selama 9 jam. Berapa kilometer yang ditempuh?", 288, makeExplanation(
    "Jarak = kecepatan x waktu.",
    "32 x 9 = 288. Ketik jawaban: 288.",
    "Kecepatan per jam langsung dikalikan lama waktu.",
    "30 x 9 + 2 x 9 = 270 + 18 = 288."
  )],
  ["14 peti mangga total beratnya 280 kg. Jika setiap peti kosong 2 kg, berapa berat mangganya saja?", 252, makeExplanation(
    "Berat peti kosong total = 14 x 2 = 28 kg.",
    "Berat mangga = 280 - 28 = 252. Ketik jawaban: 252.",
    "Berat total terdiri dari isi + wadah, jadi wadah harus dipisahkan.",
    "Model bruto-netto membantu menghindari salah hitung."
  )],
  ["Persediaan air cukup untuk 8 ekor sapi selama 90 hari. Berapa hari cukup untuk 24 ekor sapi?", 30, makeExplanation(
    "Kapasitas total = 8 x 90 = 720 sapi-hari.",
    "Untuk 24 sapi: 720 : 24 = 30. Ketik jawaban: 30.",
    "Jumlah persediaan tetap sehingga hasil kali ekor x hari konstan.",
    "Jika sapi naik 3 kali, hari turun 3 kali."
  )],
  ["5 pensil harganya Rp 15,-. Dengan Rp 150,- bisa membeli berapa pensil?", 50, makeExplanation(
    "Harga per pensil = 15 : 5 = 3 rupiah.",
    "Jumlah pensil = 150 : 3 = 50. Ketik jawaban: 50.",
    "Setelah harga satuan diketahui, jumlah barang mudah dihitung.",
    "Skala cepat: 150 adalah 10 kali 15, maka pensil 10 kali 5."
  )],
  ["Seseorang berjalan 2,1 meter dalam 0,3 detik. Berapa meter ditempuh dalam 12 detik?", 84, makeExplanation(
    "Kecepatan per detik = 2,1 : 0,3 = 7 meter/detik.",
    "Dalam 12 detik: 7 x 12 = 84. Ketik jawaban: 84.",
    "Cari laju per detik dulu agar operasi utama jadi perkalian sederhana.",
    "Membagi 0,3 sama dengan mengalikan 10 lalu membagi 3."
  )],
  ["Sebuah sumur 18 m di timur pohon, dan pohon 27 m di timur rumah. Berapa jarak sumur ke rumah?", 45, makeExplanation(
    "Kedua jarak berada pada arah yang sama.",
    "18 + 27 = 45. Ketik jawaban: 45.",
    "Pada posisi segaris dan searah, jarak total dijumlahkan.",
    "Bayangkan garis lurus posisi agar operasi langsung terlihat."
  )],
  ["Jika 6 meter kain harganya Rp 168,-, berapa harga 2 1/2 meter?", 70, makeExplanation(
    "Harga per meter = 168 : 6 = 28 rupiah.",
    "Harga 2,5 meter = 28 x 2,5 = 70. Ketik jawaban: 70.",
    "Harga berbanding lurus dengan panjang kain.",
    "2,5 meter bisa dihitung sebagai 5/2 meter."
  )],
  ["12 pekerja menyelesaikan proyek dalam 5 hari. Berapa pekerja dibutuhkan agar selesai dalam 1 hari?", 60, makeExplanation(
    "Total beban kerja = 12 x 5 = 60 pekerja-hari.",
    "Untuk 1 hari dibutuhkan 60 pekerja. Ketik jawaban: 60.",
    "Pekerja x hari konstan untuk pekerjaan yang sama.",
    "Jika hari diperkecil menjadi 1, jumlah pekerja sama dengan total pekerja-hari."
  )],
  ["Seseorang menghabiskan 1/5 uangnya untuk makan dan 2 kali jumlah itu untuk transport. Jika sisa uang Rp 80,-, berapa uang semula?", 200, makeExplanation(
    "Makan = 1/5, transport = 2/5, jadi total dipakai = 3/5.",
    "Sisa = 2/5 = 80, maka total uang = 80 x 5/2 = 200. Ketik jawaban: 200.",
    "Semua komponen biaya harus dinyatakan sebagai pecahan dari total.",
    "Jika 2/5 diketahui, cari 1/5 dulu lalu kalikan 5."
  )],
  ["7, 12, 17, 22, 27, 32, 37, ?", 42, makeExplanation(
    "Selisih tetap +5.",
    "37 + 5 = 42. Ketik jawaban: 42.",
    "Deret aritmetika punya beda konstan.",
    "Cek cepat dua suku terakhir untuk pastikan beda."
  )],
  ["9, 11, 15, 17, 21, 23, 27, ?", 29, makeExplanation(
    "Pola berulang +2 lalu +4.",
    "Setelah 27, giliran +2 sehingga 29. Ketik jawaban: 29.",
    "Deret menggunakan dua selisih bergantian.",
    "Tuliskan operator berulang agar tidak tertukar."
  )],
  ["18, 17, 23, 22, 28, 27, 33, ?", 32, makeExplanation(
    "Pola berulang -1 lalu +6.",
    "Setelah 33, operasi berikut -1 menjadi 32. Ketik jawaban: 32.",
    "Kombinasi turun kecil dan naik besar berulang teratur.",
    "Pisahkan langkah ganjil-genap untuk verifikasi."
  )],
  ["4, 8, 11, 22, 25, 50, 53, ?", 106, makeExplanation(
    "Pola berulang x2 lalu +3.",
    "Setelah 53, giliran x2 sehingga 106. Ketik jawaban: 106.",
    "Kenaikan besar-kecil yang periodik menandakan pola campuran.",
    "Uji pola 2 langkah jika deret terlihat zig-zag."
  )],
  ["30, 28, 31, 27, 32, 26, 33, ?", 25, makeExplanation(
    "Pisah dua deret: ganjil 30,31,32,33 dan genap 28,27,26,?.",
    "Deret genap turun 1, jadi suku berikutnya 25. Ketik jawaban: 25.",
    "Deret campuran sering lebih jelas jika dipisah indeks ganjil-genap.",
    "Bandingkan suku posisi 2,4,6,8."
  )],
  ["13, 11, 18, 16, 23, 21, 28, ?", 26, makeExplanation(
    "Pola berulang -2 lalu +7.",
    "Setelah 28, operasi berikut -2 sehingga 26. Ketik jawaban: 26.",
    "Dua operasi berulang membentuk ritme naik-turun tetap.",
    "Cari selisih antar-suku untuk mendeteksi pola cepat."
  )],
  ["5, 8, 12, 17, 23, 30, 38, ?", 47, makeExplanation(
    "Selisih bertambah +3, +4, +5, +6, +7, +8.",
    "Selisih berikut +9, jadi 38 + 9 = 47. Ketik jawaban: 47.",
    "Saat selisih naik satu-satu, deret utama cenderung kuadratik.",
    "Lihat deret beda antar-suku, bukan suku langsung."
  )],
  ["6, 7, 5, 9, 10, 8, 12, ?", 13, makeExplanation(
    "Pola berulang +1, -2, +4.",
    "Setelah 12, kembali ke +1 sehingga 13. Ketik jawaban: 13.",
    "Tiga operasi diputar dengan urutan tetap.",
    "Gunakan blok perubahan tiga langkah."
  )],
  ["4, 12, 8, 24, 20, 60, 56, ?", 168, makeExplanation(
    "Pola berulang x3 lalu -4.",
    "Setelah 56, giliran x3 sehingga 168. Ketik jawaban: 168.",
    "Penurunan kecil diselingi lonjakan kali tetap.",
    "Identifikasi pasangan operasi (kali, kurang) yang berulang."
  )],
  ["20, 30, 25, 20, 30, 25, 20, ?", 30, makeExplanation(
    "Pola tiga suku berulang: 20, 30, 25.",
    "Setelah 20, kembali ke 30. Ketik jawaban: 30.",
    "Deret periodik bisa dipecahkan dengan mengenali siklus nilai.",
    "Kelompokkan angka ke blok yang sama untuk memprediksi suku berikut."
  )]
];

const tb5_questions = buildNumericInput(tb5_data, 157);


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
  },
  B1: {
    title: "TES NUMERIK B01",
    description: "Soal hitungan isian angka (jawab dengan mengetik angka saja).",
    instructions: "Persoalan berikutnya ialah soal-soal hitungan.\n\nCara menjawab pada aplikasi ini:\n1. Untuk setiap soal, ketik hasil akhir pada kolom jawaban.\n2. Jawaban hanya boleh angka 0 sampai 9 (tanpa huruf, tanpa satuan, tanpa simbol).\n3. Jika soal menanyakan rupiah, kilometer, meter, persen, atau hari, cukup ketik angkanya saja.\n4. Gunakan bilangan bulat sesuai hasil perhitungan soal.\n\nContoh: jika jawaban 75, maka yang ditulis adalah 75.\nContoh: jika jawaban 60, maka yang ditulis adalah 60.",
    examples: [
      {
        text: "Contoh 1) Sebatang pensil harganya 25 rupiah. Berapakah harga 3 batang?",
        options: ["Jawab dengan isian angka"],
        explanation: "25 x 3 = 75, jadi yang diketik adalah 75."
      },
      {
        text: "Contoh 2) Dengan sepeda Husin dapat mencapai 15 km dalam waktu 1 jam. Berapa km yang dapat ia capai dalam 4 jam?",
        options: ["Jawab dengan isian angka"],
        explanation: "15 x 4 = 60, jadi yang diketik adalah 60."
      }
    ],
    closingInstruction: "Pastikan jawaban sudah berupa angka sebelum pindah ke soal berikutnya.",
    note: "Mode Jawaban: Isian angka saja (0-9)",
    questions: tb1_questions
  },
  B2: {
    title: "TES NUMERIK B02",
    description: "Soal deret angka isian (lanjutan, jawab dengan angka saja).",
    instructions: "Soal-soal berikut adalah deret angka. Setiap baris berisi pola tertentu dan satu angka terakhir diganti dengan tanda tanya.\n\nCara menjawab pada aplikasi ini:\n1. Temukan pola perubahan pada deret.\n2. Ketik angka yang tepat sebagai pengganti tanda tanya.\n3. Jawaban hanya boleh angka 0 sampai 9 (tanpa huruf, tanpa simbol).\n4. Ketik hasil akhir saja.\n\nContoh: 6, 9, 12, 15, ? maka jawabannya 18.",
    examples: [
      {
        text: "Contoh 1) 10, 13, 16, 19, ?",
        options: ["Jawab dengan isian angka"],
        explanation: "Pola +3, sehingga jawaban adalah 22."
      },
      {
        text: "Contoh 2) 5, 10, 20, 40, ?",
        options: ["Jawab dengan isian angka"],
        explanation: "Pola x2, sehingga jawaban adalah 80."
      }
    ],
    closingInstruction: "Fokus pada pola selisih, perbandingan, atau operasi berulang sebelum mengisi jawaban.",
    note: "Mode Jawaban: Isian angka saja (0-9)",
    questions: tb2_questions
  },
  B3: {
    title: "TES NUMERIK B03",
    description: "Soal cerita perbandingan isian angka (latihan tambahan 20 soal).",
    instructions: "Persoalan berikut adalah soal hitungan cerita perbandingan.\n\nCara menjawab pada aplikasi ini:\n1. Baca cerita, tentukan operasi hitung yang tepat, lalu ketik hasil akhirnya.\n2. Jawaban hanya boleh angka 0 sampai 9 (tanpa huruf, tanpa satuan, tanpa simbol).\n3. Jika soal menanyakan rupiah, meter, hari, atau persen, cukup ketik angkanya saja.\n4. Gunakan bilangan bulat sesuai hasil akhir.",
    examples: [
      {
        text: "Contoh 1) 4 buku harganya Rp 20,-. Berapa harga 7 buku?",
        options: ["Jawab dengan isian angka"],
        explanation: "Harga per buku 5, maka 7 buku = 35."
      },
      {
        text: "Contoh 2) Perbandingan A:B = 2:3 dan total 50. Berapa nilai B?",
        options: ["Jawab dengan isian angka"],
        explanation: "Total bagian 5, tiap bagian 10, maka B = 30."
      }
    ],
    closingInstruction: "Gunakan kertas buram jika perlu, lalu ketik hasil akhir dalam bentuk angka saja.",
    note: "Mode Jawaban: Isian angka saja (0-9)",
    questions: tb3_questions
  },
  B4: {
    title: "TES NUMERIK B04",
    description: "Soal deret angka isian (latihan tambahan 20 soal).",
    instructions: "Soal-soal berikut adalah deret angka. Setiap baris memiliki pola tertentu dan angka terakhir diganti tanda tanya.\n\nCara menjawab:\n1. Temukan pola perubahan deret.\n2. Ketik angka pengganti tanda tanya.\n3. Jawaban hanya angka 0 sampai 9 tanpa simbol.",
    examples: [
      {
        text: "Contoh 1) 5, 10, 15, 20, ?",
        options: ["Jawab dengan isian angka"],
        explanation: "Pola +5, jadi jawabannya 25."
      },
      {
        text: "Contoh 2) 3, 6, 12, 24, ?",
        options: ["Jawab dengan isian angka"],
        explanation: "Pola x2, jadi jawabannya 48."
      }
    ],
    closingInstruction: "Pastikan pola sudah benar sebelum mengetik jawaban akhir.",
    note: "Mode Jawaban: Isian angka saja (0-9)",
    questions: tb4_questions
  },
  B5: {
    title: "TES NUMERIK B05",
    description: "Soal gabungan isian angka: 10 soal cerita + 10 soal deret.",
    instructions: "Tes ini adalah gabungan dua tipe.\n\nNomor 1-10: soal cerita perbandingan.\nNomor 11-20: soal deret angka.\n\nCara menjawab:\n1. Semua jawaban diketik pada kolom isian angka.\n2. Gunakan angka saja tanpa huruf/simbol/satuan.\n3. Ketik hasil akhir yang paling tepat.",
    examples: [
      {
        text: "Contoh 1) 2 roti seharga 8 rupiah. Berapa harga 5 roti?",
        options: ["Jawab dengan isian angka"],
        explanation: "Harga per roti 4, maka 5 roti = 20."
      },
      {
        text: "Contoh 2) 4, 7, 10, 13, ?",
        options: ["Jawab dengan isian angka"],
        explanation: "Pola +3, jadi jawabannya 16."
      }
    ],
    closingInstruction: "Kerjakan berurutan dengan teliti, lalu ketik angka jawaban pada setiap soal.",
    note: "Mode Jawaban: Isian angka saja (0-9)",
    questions: tb5_questions
  }
};

const NUMERIC_TYPES = {
  A: {
    title: "Tes Numerik A",
    description: "Berisi 6 modul yang sudah tersedia: Tes Numerik 01 sampai Tes Numerik 06.",
    testIds: ["1", "2", "3", "4", "5", "6"]
  },
  B: {
    title: "Tes Numerik B",
    description: "Berisi tes numerik model isian angka. Saat ini tersedia Tes Numerik B01 sampai B05.",
    testIds: ["B1", "B2", "B3", "B4", "B5"]
  }
};

const buildStoryExplanation = (question) => {
  const questionText = stripQuestionNumber(question.text);
  const rawExplanation = typeof question.explanation === 'string' ? question.explanation : '';
  const category = getStoryCategory(questionText, rawExplanation);
  const cleanedExplanation = rawExplanation.replace(/\s*Opsi\s+[a-e]\.?$/i, '').trim();
  const explanationSentence = cleanedExplanation
    ? `${cleanedExplanation}${cleanedExplanation.endsWith('.') ? '' : '.'}`
    : 'Kerjakan operasi yang sesuai sampai hasil akhirnya ditemukan.';

  return makeExplanation(
    getStoryStep1(category),
    `${explanationSentence} ${getAnswerSummary(question)}`,
    getStoryWhy(category),
    getStoryTip(category)
  );
};

Object.values(TEST_DATA).forEach((test) => {
  test.questions = test.questions.map((question) => {
    if (isNumericInputQuestion(question)) {
      return question;
    }

    if (typeof question.explanation === 'object' && question.explanation?.step1) {
      return question;
    }

    if (isTrueFalseQuestion(question)) {
      return {
        ...question,
        explanation: explainLetters(stripQuestionNumber(question.text), question.correctAnswer)
      };
    }

    if (isPureCalculationQuestion(question.text)) {
      return {
        ...question,
        explanation: buildArithmeticExplanation(question)
      };
    }

    return {
      ...question,
      explanation: buildStoryExplanation(question)
    };
  });
});


export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome'); // welcome, home, instruction, quiz, result
  const [activeTest, setActiveTest] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
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

  const stripQuestionPrefix = (text) => stripQuestionNumber(text);

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

  const handleNumericAnswerChange = (value) => {
    const digitsOnly = sanitizeDigitsInput(value);
    setAnswers((prev) => {
      const next = { ...prev };
      if (digitsOnly === '') {
        delete next[currentQuestionIndex];
      } else {
        next[currentQuestionIndex] = digitsOnly;
      }
      return next;
    });
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
                    setSelectedType(null);
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
                setSelectedType(null);
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

  const renderHome = () => {
    const selectedTypeData = selectedType ? NUMERIC_TYPES[selectedType] : null;
    const testsInSelectedType = selectedTypeData
      ? selectedTypeData.testIds.map((testId) => [testId, TEST_DATA[testId]]).filter((entry) => Boolean(entry[1]))
      : [];

    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-3 sm:space-y-4 bg-blue-600 text-white p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-left">
            <div className="bg-white/12 border border-white/15 rounded-2xl px-4 py-3 text-center sm:text-left w-full sm:w-auto">
              <div className="text-xs uppercase tracking-[0.2em] text-blue-100 font-bold">Siswa Aktif</div>
              <div className="text-lg sm:text-xl font-bold mt-1">{studentName || 'Siswa'}</div>
            </div>
            <button
              onClick={() => {
                setSelectedType(null);
                setCurrentScreen('welcome');
              }}
              className="w-full sm:w-auto rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15 transition"
            >
              Ganti Nama
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Portal Psikotes Numerik</h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Selamat datang, {studentName || 'Siswa'}. Pilih tipe tes numerik untuk memulai latihan.
          </p>
        </div>

        {!selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(NUMERIC_TYPES).map(([typeKey, typeData]) => (
              <div key={typeKey} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{typeData.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{typeData.description}</p>
                  <p className="text-sm font-bold text-blue-500 mt-4 bg-blue-50 inline-block px-3 py-1 rounded-full">
                    {typeData.testIds.length > 0 ? `${typeData.testIds.length} Modul Siap` : "Belum Ada Modul"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedType(typeKey)}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 font-semibold py-3 px-4 rounded-xl transition-colors border border-gray-200 hover:border-blue-600"
                >
                  <PlayCircle className="w-5 h-5" />
                  Buka {typeData.title}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedType && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedTypeData.title}</h2>
                <p className="text-gray-600">{selectedTypeData.description}</p>
              </div>
              <button
                onClick={() => setSelectedType(null)}
                className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Pilih Tipe Lain
              </button>
            </div>

            {testsInSelectedType.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testsInSelectedType.map(([id, test]) => (
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
            ) : (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Tes Numerik B</h3>
                <p className="text-gray-600">Belum ada modul di tipe ini. Nanti kita tambahkan bersama.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
    const answeredCount = test.questions.reduce((count, q, index) => (
      hasAnswer(q, answers[index]) ? count + 1 : count
    ), 0);

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
                const isAnswered = hasAnswer(test.questions[index], answers[index]);

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

          {isNumericInputQuestion(question) ? (
            <div className="space-y-4">
              <label className="block text-sm sm:text-base font-bold text-gray-700">
                Jawaban Isian Angka
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={sanitizeDigitsInput(String(answers[currentQuestionIndex] ?? ''))}
                onChange={(e) => handleNumericAnswerChange(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-xl sm:text-2xl font-bold text-gray-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Ketik jawaban angka"
              />
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600">
                Gunakan angka saja (0-9), tanpa huruf, tanpa satuan, dan tanpa simbol.
              </div>
            </div>
          ) : (
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
          )}
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
                answeredCount === test.questions.length
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
    let answeredCount = 0;

    test.questions.forEach((q, index) => {
      if (hasAnswer(q, answers[index])) {
        answeredCount++;
      }
      if (isAnswerCorrect(q, answers[index])) {
        correctCount++;
      }
    });
    let emptyCount = test.questions.length - answeredCount;

    const score = Math.round((correctCount / test.questions.length) * 100);
    const wrongCount = answeredCount - correctCount;
    const focusedQuestion = test.questions[resultFocusIndex] || test.questions[0];
    const focusedUserAnswer = answers[resultFocusIndex];
    const focusedIsCorrect = isAnswerCorrect(focusedQuestion, focusedUserAnswer);
    const focusedIsEmpty = !hasAnswer(focusedQuestion, focusedUserAnswer);
    const focusedUserAnswerText = isNumericInputQuestion(focusedQuestion)
      ? (focusedIsEmpty ? "TIDAK DIJAWAB" : sanitizeDigitsInput(String(focusedUserAnswer)))
      : focusedQuestion.options.find((o) => o.id === focusedUserAnswer)?.text || "TIDAK DIJAWAB";
    const focusedCorrectAnswerText = isNumericInputQuestion(focusedQuestion)
      ? String(focusedQuestion.correctAnswer)
      : focusedQuestion.options.find((o) => o.id === focusedQuestion.correctAnswer)?.text;
    const performanceReview = getResultFeedback(score, timerSeconds);
    const explanationSections = typeof focusedQuestion.explanation === 'string'
      ? [
          { title: 'Langkah 1', content: focusedQuestion.explanation },
          { title: 'Kenapa begitu', content: 'Soal ini dikerjakan dengan mengikuti aturan hitung yang benar hingga hasil akhirnya sesuai.' }
        ]
      : [
          { title: 'Langkah 1', content: focusedQuestion.explanation?.step1 },
          { title: 'Langkah 2', content: focusedQuestion.explanation?.step2 },
          { title: 'Kenapa begitu', content: focusedQuestion.explanation?.why },
          { title: 'Trik cepat', content: focusedQuestion.explanation?.tip }
        ].filter((section) => section.content);

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
              const isCorrect = isAnswerCorrect(q, userAnswer);
              const isEmpty = !hasAnswer(q, userAnswer);
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

              <div className="space-y-3">
                {explanationSections.map((section) => (
                  <div key={section.title} className="bg-gray-50 text-gray-700 p-4 rounded-xl text-sm leading-relaxed border border-gray-200 break-words">
                    <div className="font-bold text-gray-800 mb-1">{section.title}</div>
                    <div>{section.content}</div>
                  </div>
                ))}
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
