import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dumbbell, Footprints, Wind, Flame, RotateCw, Bike, Moon,
  Target, Beef, ChevronLeft, ChevronRight, Check, Ruler, Info, X, ChevronDown, BookOpen, Youtube,
  List as ListIcon, CalendarDays, Calendar, CalendarRange, Copy, RefreshCw,
  Timer, Play, Pause, RotateCcw, TrendingDown, History, Zap, CheckCheck, Dumbbell as DumbbellIcon,
  Trophy, Activity, Gauge, CalendarCheck, BarChart3, ArrowUp, ArrowDown, CircleDot,
} from "lucide-react";

/* ---------- storage compatibility ---------- */
// Claude Artifacts may provide window.storage, while normal React hosts usually
// provide localStorage. Keep the app working in both environments.
function withTimeout(promise, ms = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("storage timeout")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

const storage = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage?.get) {
        return await withTimeout(window.storage.get(key));
      }
    } catch {
      // Timed out or errored — fall through to localStorage instead of hanging forever.
    }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const value = window.localStorage.getItem(key);
        return value === null ? null : { value };
      }
    } catch {
      return null;
    }
    return null;
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage?.set) {
        return await withTimeout(window.storage.set(key, value));
      }
    } catch {
      // Timed out or errored — fall through to localStorage instead of hanging forever.
    }
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return { value };
      }
    } catch {
      return null;
    }
    return null;
  },
};

/* ---------- data ---------- */

const DAYS = [
  {
    key: "mon", jp: "月", full: "月曜日", title: "胸・肩・腹筋",
    color: "#5B8CFF", icon: Dumbbell,
    note: null,
    indoorAlt: [
      { name: "その場足踏み", detail: "5分 × 4セット", howto: "その場で足踏みしながら腕を軽く振る。ウォーキングと同様、少し息が弾む程度のペースをキープする。" },
      { name: "ジャンピングジャック", detail: "30秒 × 6セット", howto: "両足を閉じて立ち、ジャンプで足を開きながら両腕を頭上に振り上げる。着地と同時に元の姿勢に戻す動きをテンポよく繰り返す。" },
    ],
    exercises: [
      { id: "m1", name: "ベンチプレス", weight: "8〜10kg", detail: "10〜12回 × 3セット", sets: 3, pose: "bench",
        howto: "ベンチに仰向けに寝て、足は床にしっかりつける。ダンベルを胸の横で構え、息を吸いながらゆっくり下ろし、胸に軽く触れたら息を吐きながら真上に押し上げる。肩をすくめず、肩甲骨を寄せたまま行うのがコツ。" },
      { id: "m2", name: "インクラインベンチプレス", weight: "7〜9kg", detail: "10〜12回 × 3セット", sets: 3, pose: "inclineBench",
        howto: "ベンチの背もたれを30〜45度に傾けて座る。ダンベルを肩の高さで構え、通常のベンチプレスと同じ要領で真上に押し上げる。胸の上部に効かせるため、腕は垂直よりやや頭側に傾ける意識で。" },
      { id: "m3", name: "ダンベルフライ", weight: "5〜7kg", detail: "12回 × 3セット", sets: 3, pose: "fly",
        howto: "仰向けに寝て、両手にダンベルを持ち胸の上でまっすぐ構える。肘を軽く曲げたまま、円を描くように左右へゆっくり下ろし、胸の筋肉が伸びるのを感じたら同じ軌道で戻す。重すぎると肩を痛めるので軽めの重量で丁寧に。" },
      { id: "m4", name: "ショルダープレス", weight: "6〜8kg", detail: "10回 × 3セット", sets: 3, pose: "shoulderPress",
        howto: "座るか立った状態で、ダンベルを耳の横で構える。反動を使わず、息を吐きながら両腕をまっすぐ頭上に押し上げ、息を吸いながらゆっくり戻す。腰を反りすぎないよう、お腹に軽く力を入れておく。" },
      { id: "m5", name: "サイドレイズ", weight: "3〜5kg", detail: "15回 × 3セット", sets: 3, pose: "sideRaise",
        howto: "両手にダンベルを持ち体の横に垂らす。肘を軽く曲げたまま、腕を横から肩の高さまでゆっくり持ち上げ、頂点で一瞬止めてから下ろす。反動を使わず、肩の筋肉で上げる意識を持つ。" },
      { id: "m6", name: "クランチ", weight: null, detail: "20回 × 3セット", sets: 3, pose: "crunch",
        howto: "仰向けに寝て膝を立て、手は頭の後ろか胸の前に添える。息を吐きながらおへそを覗き込むように上体を丸め、肩甲骨が床から離れるところまで起こしたらゆっくり戻す。首の力ではなくお腹の力で起こすのがポイント。",
        alt: { name: "腹筋ローラー（膝つき）", detail: "8〜10回 × 3セット", howto: "膝をついた姿勢でローラーを両手で持ち、体を前方にゆっくり転がしていく。腰が反らない範囲まで伸ばしたら、お腹の力で元の位置まで引き戻す。クランチより強い負荷がかかるので、最初は小さい可動域から始める。" } },
      { id: "m7", name: "ウォーキング", weight: null, detail: "20〜30分", sets: 1, cardio: true, pose: "walk",
        howto: "背筋を伸ばし、少し息が弾む程度の速さで歩く。腕を軽く振り、着地はかかとから。トレーニング後の脂肪燃焼を高めるクールダウン兼有酸素運動。" },
    ],
  },
  {
    key: "tue", jp: "火", full: "火曜日", title: "脚",
    color: "#4ADE80", icon: Footprints,
    note: null,
    exercises: [
      { id: "t1", name: "ゴブレットスクワット", weight: "10kg", detail: "15回 × 3セット", sets: 3, pose: "squat",
        howto: "ダンベルを両手で縦に持ち、胸の前で構える。足は肩幅よりやや広めに開き、つま先を軽く外に向ける。息を吸いながらお尻を後ろに引くように腰を落とし、太ももが床と平行になったら息を吐きながら立ち上がる。膝がつま先より前に出過ぎないように注意。" },
      { id: "t2", name: "ブルガリアンスクワット", weight: "6〜8kg", detail: "左右10回 × 3セット", sets: 3, pose: "bulgarianSquat",
        howto: "後ろ足の甲を椅子やベンチに乗せ、前足一本で体を支える。両手にダンベルを持ち、上体を軽く前傾させながら前足の膝を曲げて腰を落とす。前ももとお尻に効いているのを感じながら、ゆっくり戻す。バランスを崩しやすいので最初は軽い重量から。" },
      { id: "t3", name: "ルーマニアンデッドリフト", weight: "10kg×2", detail: "12回 × 3セット", sets: 3, pose: "hinge",
        howto: "ダンベルを両手に持ち、脚の前で構える。膝を軽く曲げたまま、背中をまっすぐに保ちお尻を後ろに引きながら上体を前に倒す。もも裏が伸びるのを感じたら、そこから腰を使ってまっすぐ立ち上がる。背中を丸めないことが最重要。" },
      { id: "t4", name: "ベンチステップアップ", weight: null, detail: "左右12回 × 3セット", sets: 3, pose: "stepUp",
        howto: "台やベンチの前に立ち、片足を台の上にしっかり乗せる。乗せた足の力で体を持ち上げて台の上に立ち、反対の足はゆっくり床に下ろす。左右交互に行い、勢いをつけず太ももの力で上がる意識を持つ。" },
      { id: "t5", name: "カーフレイズ", weight: "10kg×2", detail: "20回 × 3セット", sets: 3, pose: "calfRaise",
        howto: "ダンベルを両手に持って立ち、かかとをゆっくり持ち上げてつま先立ちになる。ふくらはぎが収縮するのを感じたら、一瞬止めてからゆっくりかかとを下ろす。反動を使わずゆっくり行うと効果が高まる。" },
    ],
  },
  {
    key: "wed", jp: "水", full: "水曜日", title: "有酸素・ストレッチ",
    color: "#2DD4BF", icon: Wind,
    note: null,
    indoorAlt: [
      { name: "その場足踏み・もも上げ", detail: "5分 × 6セット", howto: "その場で足踏みしながら、太ももを腰の高さまで上げる。腕も大きく振り、会話はできるが少し息が弾む速さでテンポよく続ける。" },
      { name: "スクワット（自重）", detail: "20回 × 4セット", howto: "足を肩幅に開き、胸を張って腰を後ろに引くように落とす。太ももが床と平行になったら立ち上がる。ダンベルなしでリズムよく行い心拍数を上げる。" },
      { name: "ジャンピングジャック", detail: "30秒 × 8セット", howto: "両足を閉じて立ち、ジャンプで足を開きながら両腕を頭上に振り上げる。着地と同時に足を閉じ腕を下ろす。テンポよく続けて心拍数を上げる。" },
      { name: "マウンテンクライマー", detail: "20回 × 4セット", howto: "腕立て伏せの姿勢から、片膝ずつ交互に胸へ引き寄せる。お尻が上がらないよう体を一直線に保ち、テンポよく足を入れ替える。" },
    ],
    exercises: [
      { id: "w1", name: "ウォーキング", weight: null, detail: "45〜60分", sets: 1, cardio: true, pose: "walk",
        howto: "背筋を伸ばし、腕を軽く振りながら少し息が弾む速さで歩く。会話はできるが少しきついくらいのペースが脂肪燃焼に効果的。水分補給を忘れずに。" },
      { id: "w2", name: "ストレッチ", weight: null, detail: "10分", sets: 1, cardio: true, pose: "stretch",
        howto: "肩・太もも・お尻・背中など大きな筋肉を中心に、反動をつけずに20〜30秒かけてじっくり伸ばす。呼吸を止めず、痛気持ちいい程度で止めるのがポイント。" },
    ],
  },
  {
    key: "thu", jp: "木", full: "木曜日", title: "背中・腕・腹筋",
    color: "#C084FC", icon: Flame,
    note: null,
    exercises: [
      { id: "h1", name: "ワンハンドロー", weight: "10kg", detail: "左右12回 × 3セット", sets: 3, pose: "row",
        howto: "片手・片膝をベンチにつき、上体を床と平行に近づける。反対の手でダンベルを持ち、脇を締めながら肘を後ろに引き上げる。背中の力で引く意識を持ち、下ろすときはゆっくり腕を伸ばしきる。" },
      { id: "h2", name: "チェストサポートロー", weight: "8〜10kg", detail: "12回 × 3セット", sets: 3, pose: "chestSupportRow",
        howto: "傾けたベンチに胸を預けてうつ伏せに近い姿勢を取る。両手にダンベルを持ち、肘を後ろに引くように引き上げ、肩甲骨を寄せる。反動が使えない分、背中にしっかり効かせやすい種目。" },
      { id: "h3", name: "ダンベルデッドリフト", weight: "10kg×2", detail: "12回 × 3セット", sets: 3, pose: "hinge",
        howto: "足を腰幅に開き、ダンベルを脚の前で持つ。背中をまっすぐに保ったまま、お尻を後ろに引きながら膝を軽く曲げて上体を倒す。床につく手前まで下ろしたら、脚とお尻の力で立ち上がる。背中は丸めない。" },
      { id: "h4", name: "ダンベルカール", weight: "6〜8kg", detail: "12回 × 3セット", sets: 3, pose: "curl",
        howto: "両手にダンベルを持ち、腕を体の横に垂らして立つ。肘の位置を固定したまま、前腕を巻き上げるようにダンベルを持ち上げ、力こぶを収縮させたらゆっくり下ろす。体を反らして反動をつけないように注意。" },
      { id: "h5", name: "ハンマーカール", weight: "6〜8kg", detail: "12回 × 3セット", sets: 3, pose: "curl",
        howto: "ダンベルを手のひらが向き合う向き（縦持ち）で構える。肘を固定したまま、そのままの向きでダンベルを持ち上げ、ゆっくり下ろす。前腕と二の腕の外側に効く種目。" },
      { id: "h6", name: "レッグレイズ", weight: null, detail: "15回 × 3セット", sets: 3, pose: "legRaise",
        howto: "仰向けに寝て、両手を体の横か腰の下に置く。脚をそろえたまま、息を吐きながら床と垂直近くまでゆっくり持ち上げ、息を吸いながらゆっくり下ろす。腰が反らないよう、下ろしすぎに注意。",
        alt: { name: "腹筋ローラー（膝つき）", detail: "8〜10回 × 3セット", howto: "膝をついた姿勢でローラーを両手で持ち、体を前方にゆっくり転がしていく。腰が反らない範囲まで伸ばしたら、お腹の力で元の位置まで引き戻す。レッグレイズより体幹全体に強い負荷がかかる種目。" } },
    ],
  },
  {
    key: "fri", jp: "金", full: "金曜日", title: "全身サーキット",
    color: "#FB923C", icon: RotateCw,
    note: "3周（休憩30〜60秒）",
    exercises: [
      { id: "f1", name: "ベンチプレス", weight: null, detail: "10回", sets: 1, pose: "bench",
        howto: "月曜と同じ要領で、軽めの重量でテンポよく行う。フォームを崩さない範囲でスピードを意識し、心拍数を上げるのが狙い。" },
      { id: "f2", name: "スクワット", weight: null, detail: "15回", sets: 1, pose: "squat",
        howto: "足を肩幅に開き、胸を張って腰を後ろに引くように落とす。太ももが床と平行になったら立ち上がる。ダンベルなしの自重でOK、リズムよく行う。" },
      { id: "f3", name: "ワンハンドロー", weight: null, detail: "10回（左右）", sets: 1, pose: "row",
        howto: "木曜のワンハンドローと同じフォームで、軽めの重量でテンポよく左右行う。" },
      { id: "f4", name: "ショルダープレス", weight: null, detail: "10回", sets: 1, pose: "shoulderPress",
        howto: "月曜のショルダープレスと同じ要領で、軽めの重量でリズムよく押し上げる。" },
      { id: "f5", name: "プランク", weight: null, detail: "45秒", sets: 1, pose: "plank",
        howto: "うつ伏せから肘とつま先で体を支え、頭からかかとまで一直線をキープする。お尻が上がったり腰が落ちたりしないよう、お腹に力を入れたまま呼吸を続ける。" },
    ],
  },
  {
    key: "sat", jp: "土", full: "土曜日", title: "有酸素運動",
    color: "#F472B6", icon: Bike,
    note: null,
    indoorAlt: [
      { name: "その場ジョギング・もも上げダッシュ", detail: "1分 × 10セット", howto: "その場で腕を大きく振りながらジョギングのテンポで足踏みする。慣れてきたら太ももを高く上げてスピードを上げ、息が弾む強度を保つ。" },
      { name: "バーピー", detail: "10回 × 5セット", howto: "しゃがんで両手を床につき、両足を後ろに伸ばして腕立ての姿勢になる。素早く足を戻してしゃがみ、そのままジャンプして両手を上げる。一連の動作をテンポよく繰り返す。" },
      { name: "ジャンピングジャック", detail: "45秒 × 8セット", howto: "両足を閉じて立ち、ジャンプで足を開きながら両腕を頭上に振り上げる。着地と同時に元に戻す。土曜日は45秒と長めに設定し強度を上げる。" },
      { name: "スクワットジャンプ", detail: "15回 × 5セット", howto: "スクワットの姿勢まで腰を落としたら、その反動を使って真上にジャンプする。着地は膝を軽く曲げてやさしく衝撃を吸収し、すぐ次のスクワットに移る。" },
    ],
    exercises: [
      { id: "s1", name: "ウォーキング", weight: null, detail: "60分", sets: 1, cardio: true, pose: "walk",
        howto: "少し息が弾む速さで、腕を振りながら歩く。長時間になるので、水分補給と歩きやすい靴を用意する。" },
      { id: "s2", name: "ジョギング（または）", weight: null, detail: "30分", sets: 1, cardio: true, pose: "walk",
        howto: "会話が続けられる程度のゆっくりしたペースで走る。着地は足の裏全体か少し前寄りで、膝への負担を抑える。ウォーキングとどちらか好きな方でOK。" },
    ],
  },
  {
    key: "sun", jp: "日", full: "日曜日", title: "休養",
    color: "#94A3B8", icon: Moon,
    note: null,
    exercises: [
      { id: "u1", name: "完全休養", weight: null, detail: "", sets: 1, cardio: true, rest: true,
        howto: "筋肉は休んでいる間に回復し成長する。トレーニングは行わず、睡眠をしっかりとって体を回復させる日にする。" },
      { id: "u2", name: "ストレッチ", weight: null, detail: "10分", sets: 1, cardio: true, pose: "stretch",
        howto: "水曜と同じく、大きな筋肉を中心にゆっくり伸ばす。1週間の疲れをほぐし、翌週に備える軽い時間にする。" },
    ],
  },
];

// Correct-form vs. common-mistake reference, keyed by exercise name.
// Adapted from the uploaded WorkoutFormCard.jsx into this app's own visual style.
const FORM_CHECK = {
  "ベンチプレス": {
    target: ["胸", "肩", "腕"],
    points: ["肩甲骨を軽く寄せて胸を張る", "ダンベルを胸の横までゆっくり下ろす", "胸で押す意識で真上へ戻す"],
    ng: ["肩をすくめる", "ダンベルを勢いよく下ろす", "腰を大きく反らせる"],
    cue: "胸の横 → 真上へ押す",
  },
  "インクラインベンチプレス": {
    target: ["胸上部", "肩", "腕"],
    points: ["背もたれを30〜45°に設定", "肩をすくめず胸を張る", "胸の上部へ向かって押す"],
    ng: ["背もたれを立てすぎる", "腰を反りすぎる", "肘を真横へ開きすぎる"],
    cue: "胸上部を意識して斜め上へ押す",
  },
  "ダンベルフライ": {
    target: ["胸"],
    points: ["肘を軽く曲げて固定する", "胸が伸びるところまでゆっくり開く", "胸を寄せるように戻す"],
    ng: ["肘を伸ばし切る", "重すぎる重量を使う", "反動でダンベルを閉じる"],
    cue: "大きな円を描くように開いて閉じる",
  },
  "ショルダープレス": {
    target: ["肩", "腕"],
    points: ["ダンベルを耳の横で構える", "お腹に力を入れて腰を安定させる", "頭上へまっすぐ押す"],
    ng: ["腰を反って押す", "膝や脚で反動をつける", "肩をすくめる"],
    cue: "耳の横 → 頭上へ",
  },
  "サイドレイズ": {
    target: ["肩"],
    points: ["肘を軽く曲げる", "肩の高さまでゆっくり上げる", "下ろす動作もゆっくり行う"],
    ng: ["肩より高く上げすぎる", "体を左右に振る", "重すぎる重量を使う"],
    cue: "体の横 → 肩の高さまで",
  },
  "ゴブレットスクワット": {
    target: ["太もも", "お尻", "体幹"],
    points: ["足を肩幅より少し広めにする", "お尻を後ろへ引きながらしゃがむ", "足裏全体で床を押して立つ"],
    ng: ["膝が内側へ入る", "背中を丸める", "かかとが浮く"],
    cue: "お尻を後ろ → 真上へ立つ",
  },
  "ブルガリアンスクワット": {
    target: ["太もも", "お尻"],
    points: ["前足に体重を乗せる", "上体を軽く前傾させる", "前足で床を押して立ち上がる"],
    ng: ["後ろ足で強く蹴る", "前膝が内側へ入る", "最初から重い重量を使う"],
    cue: "前足で支える → ゆっくり沈む",
  },
  "ルーマニアンデッドリフト": {
    target: ["もも裏", "お尻", "背中"],
    points: ["膝は軽く曲げた状態をキープ", "お尻を後ろへ引く", "背中をまっすぐに保つ"],
    ng: ["背中を丸める", "膝を深く曲げてスクワット化する", "腰だけで起き上がる"],
    cue: "お尻を後ろへ引く → お尻で戻る",
  },
  "ワンハンドロー": {
    target: ["背中", "広背筋", "腕"],
    points: ["ベンチに手と膝をついて体を安定させる", "肘を腰へ向かって引く", "下ろすときも背中を伸ばしたまま"],
    ng: ["肩をすくめる", "体をひねって引く", "腕だけでダンベルを上げる"],
    cue: "腕ではなく肘を後ろへ引く",
  },
  "チェストサポートロー": {
    target: ["背中", "広背筋"],
    points: ["胸をベンチに預ける", "肩甲骨を寄せながら肘を後ろへ", "反動を使わずゆっくり戻す"],
    ng: ["首を反らす", "肩をすくめる", "勢いで引く"],
    cue: "胸を固定 → 肘を後ろへ",
  },
  "ダンベルデッドリフト": {
    target: ["お尻", "もも裏", "背中"],
    points: ["ダンベルを体の近くで持つ", "背中をまっすぐにする", "脚とお尻で床を押して立つ"],
    ng: ["背中を丸める", "ダンベルを体から離す", "腰だけで持ち上げる"],
    cue: "床から持つ → 体の近くを通して立つ",
  },
  "ダンベルカール": {
    target: ["上腕二頭筋"],
    points: ["肘を体の横で固定する", "前腕だけを動かす", "下ろすときにゆっくり耐える"],
    ng: ["体を反らせる", "肘を前へ動かす", "反動で振り上げる"],
    cue: "肘を固定 → 力こぶで巻き上げる",
  },
  "ハンマーカール": {
    target: ["上腕二頭筋", "前腕"],
    points: ["手のひらを向かい合わせる", "肘を固定する", "ゆっくり上下させる"],
    ng: ["手首をひねる", "体を反らせる", "勢いを使う"],
    cue: "縦持ちのまま巻き上げる",
  },
  "クランチ": {
    target: ["腹筋"],
    points: ["腰を床につける", "おへそを覗き込むように丸める", "首ではなく腹筋で起きる"],
    ng: ["首を強く引っ張る", "反動で起きる", "腰を反らせる"],
    cue: "胸を骨盤へ近づける",
  },
  "レッグレイズ": {
    target: ["下腹部", "体幹"],
    points: ["脚をそろえる", "腰が浮かない範囲で下ろす", "腹筋を使ってゆっくり上げる"],
    ng: ["腰を反らせる", "脚を勢いで振る", "無理に床まで下ろす"],
    cue: "腰を安定 → 脚をゆっくり上下",
  },
  "プランク": {
    target: ["腹筋", "体幹"],
    points: ["頭からかかとまで一直線", "お腹を軽く締める", "呼吸を止めない"],
    ng: ["腰を落とす", "お尻を高く上げる", "息を止める"],
    cue: "体を一本の板にする",
  },
};

const WARMUP = ["肩回し 30秒", "腕回し 30秒", "股関節回し 30秒", "スクワット 30秒", "軽いジャンプ 30秒"];
const COOLDOWN = ["胸ストレッチ", "太もも", "お尻", "背中"];
const POINTS = [
  "セット間の休憩は60〜90秒",
  "フォームを崩さず、最後の1〜2回がきつい重さで行う",
  "重さが楽に感じるようになったら、回数を15回まで増やすか、ゆっくり下ろす（3秒かける）ことで負荷UP！",
];

// Simplified body illustrations. Each pose has a "start" and "end" frame (or one
// "keep" frame for static holds). Every frame is a full, independent set of thick
// rounded lines — the limb group actually doing the work is drawn in the accent
// color, everything else in neutral gray, so the eye goes straight to what moves.
const L = (p, m) => ({ p, m }); // p = [x1,y1,x2,y2,(x3,y3,...)] point chain, m = highlighted?

const BODY = {
  bench: {
    context: "bench",
    start: { head: [15, 50], dumbbell: [17, 26], lines: [L([21, 50, 55, 50], false), L([55, 50, 66, 34, 70, 44], false), L([21, 50, 21, 36, 17, 26], true)] },
    end: { head: [15, 50], dumbbell: [21, 10], lines: [L([21, 50, 55, 50], false), L([55, 50, 66, 34, 70, 44], false), L([21, 50, 21, 28, 21, 10], true)] },
    caption: "胸の横 → まっすぐ上へ押す",
  },
  inclineBench: {
    context: "inclineBench",
    start: { head: [62, 28], dumbbell: [52, 10], lines: [L([55, 36, 20, 72], false), L([20, 72, 28, 58, 36, 67], false), L([55, 36, 58, 20, 52, 10], true)] },
    end: { head: [62, 28], dumbbell: [55, 2], lines: [L([55, 36, 20, 72], false), L([20, 72, 28, 58, 36, 67], false), L([55, 36, 55, 17, 55, 2], true)] },
    caption: "背もたれを傾けて構え、斜め上へ押す",
  },
  fly: {
    context: "bench",
    start: { head: [15, 55], dumbbell: [12, 63], lines: [L([21, 55, 55, 55], false), L([55, 55, 66, 39, 70, 49], false), L([21, 55, 12, 63], true)] },
    end: { head: [15, 55], dumbbell: [26, 26], lines: [L([21, 55, 55, 55], false), L([55, 55, 66, 39, 70, 49], false), L([21, 55, 26, 26], true)] },
    caption: "腕を開く → 弧を描いて閉じる",
  },
  shoulderPress: {
    context: "floor",
    start: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 96], false), L([50, 55, 56, 96], false), L([40, 20, 32, 30], true), L([60, 20, 68, 30], true)] },
    end: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 96], false), L([50, 55, 56, 96], false), L([40, 20, 38, 3], true), L([60, 20, 62, 3], true)] },
    caption: "耳の横 → 頭上へ押し上げる",
  },
  sideRaise: {
    context: "floor",
    start: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 96], false), L([50, 55, 56, 96], false), L([40, 20, 37, 48], true), L([60, 20, 63, 48], true)] },
    end: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 96], false), L([50, 55, 56, 96], false), L([40, 20, 14, 20], true), L([60, 20, 86, 20], true)] },
    caption: "体の横 → 真横に持ち上げる",
  },
  curl: {
    context: "floor",
    start: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 96], false), L([50, 55, 56, 96], false), L([40, 20, 38, 42, 38, 62], true), L([60, 20, 62, 42, 62, 62], true)] },
    end: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 96], false), L([50, 55, 56, 96], false), L([40, 20, 38, 42, 28, 24], true), L([60, 20, 62, 42, 72, 24], true)] },
    caption: "肘を固定して巻き上げる",
  },
  row: {
    context: "floor",
    start: { head: [22, 22], dumbbell: [27, 58], lines: [L([27, 25, 58, 45], false), L([58, 45, 52, 74, 50, 96], false), L([58, 45, 66, 74, 68, 96], false), L([27, 25, 27, 58], true)] },
    end: { head: [22, 22], dumbbell: [15, 32], lines: [L([27, 25, 58, 45], false), L([58, 45, 52, 74, 50, 96], false), L([58, 45, 66, 74, 68, 96], false), L([27, 25, 15, 32], true)] },
    caption: "腕を伸ばす → 肘を後ろに引く",
  },
  chestSupportRow: {
    context: "inclineBench",
    start: {
      head: [62, 28], dumbbell: [64, 64],
      lines: [L([55, 36, 20, 72], false), L([20, 72, 28, 58, 36, 67], false), L([55, 36, 55, 48, 64, 64], true)],
    },
    end: {
      head: [62, 28], dumbbell: [74, 30],
      lines: [L([55, 36, 20, 72], false), L([20, 72, 28, 58, 36, 67], false), L([55, 36, 65, 38, 74, 30], true)],
    },
    caption: "胸をベンチに預け、肘を後ろへ引き上げる",
  },
  crunch: {
    context: "floor",
    start: { head: [14, 66], dumbbell: null, lines: [L([20, 66, 55, 60], true), L([55, 60, 65, 46, 78, 53], false)] },
    end: { head: [30, 46], dumbbell: null, lines: [L([35, 49, 55, 60], true), L([55, 60, 65, 46, 78, 53], false)] },
    caption: "おへそを覗き込むように丸める",
  },
  squat: {
    context: "floor",
    start: { head: [50, 10], dumbbell: null, lines: [L([50, 18, 50, 50], false), L([50, 18, 50, 40], false), L([50, 50, 44, 96], true), L([50, 50, 56, 96], true)] },
    end: { head: [50, 26], dumbbell: null, lines: [L([50, 34, 50, 66], false), L([50, 34, 50, 56], false), L([50, 66, 38, 70, 36, 96], true), L([50, 66, 62, 70, 64, 96], true)] },
    caption: "腰を落とす → 立ち上がる",
  },
  bulgarianSquat: {
    context: "rearBox",
    start: {
      head: [50, 10], dumbbell: [50, 40],
      lines: [L([50, 18, 50, 46], false), L([50, 46, 46, 70, 42, 95], true), L([50, 46, 74, 54], false), L([50, 18, 50, 40], false)],
    },
    end: {
      head: [40, 18], dumbbell: [40, 46],
      lines: [L([40, 26, 40, 54], false), L([40, 54, 34, 74, 30, 96], true), L([40, 54, 74, 58], false), L([40, 26, 40, 46], false)],
    },
    caption: "後ろ足を台に乗せ、前足の膝を曲げて腰を落とす",
  },
  hinge: {
    context: "floor",
    start: { head: [50, 10], dumbbell: null, lines: [L([50, 18, 50, 50], true), L([50, 50, 45, 96], false), L([50, 50, 55, 96], false), L([50, 18, 46, 50], false), L([50, 18, 54, 50], false)] },
    end: { head: [24, 30], dumbbell: null, lines: [L([29, 33, 55, 52], true), L([55, 52, 48, 74, 46, 96], false), L([55, 52, 60, 74, 62, 96], false), L([29, 33, 23, 58], false), L([29, 33, 33, 58], false)] },
    caption: "お尻を引いて上体を倒す",
  },
  stepUp: {
    context: "box",
    start: { head: [50, 10], dumbbell: null, lines: [L([50, 18, 50, 55], false), L([50, 55, 44, 96], true), L([50, 55, 56, 96], true)] },
    end: { head: [45, 6], dumbbell: null, lines: [L([45, 14, 45, 42], false), L([45, 42, 40, 55], true), L([45, 42, 63, 74, 68, 92], true)] },
    caption: "片足を台に乗せて踏み上がる",
  },
  calfRaise: {
    context: "floor",
    start: { head: [50, 12], dumbbell: null, lines: [L([50, 20, 50, 55], false), L([50, 55, 44, 95], true), L([50, 55, 56, 95], true)] },
    end: { head: [50, 8], dumbbell: null, lines: [L([50, 16, 50, 50], false), L([50, 50, 44, 90, 47, 94], true), L([50, 50, 56, 90, 53, 94], true)] },
    caption: "かかとを持ち上げてキープ",
  },
  legRaise: {
    context: "floor",
    start: { head: [12, 82], dumbbell: null, lines: [L([18, 82, 55, 82], false), L([55, 82, 86, 82], true)] },
    end: { head: [12, 82], dumbbell: null, lines: [L([18, 82, 55, 82], false), L([55, 82, 77, 50], true)] },
    caption: "脚をそろえたまま持ち上げる",
  },
  plank: {
    context: "floor", single: true,
    start: { head: [18, 40], dumbbell: null, lines: [L([24, 42, 58, 47], true), L([24, 42, 24, 60, 30, 64], true), L([58, 47, 88, 64], true)] },
    caption: "頭からかかとまで一直線をキープ",
  },
  walk: {
    context: "floor", single: true,
    start: { head: [50, 10], dumbbell: null, lines: [L([50, 18, 50, 50], false), L([50, 18, 35, 40], true), L([50, 18, 66, 8], true), L([50, 50, 38, 70, 33, 92], true), L([50, 50, 60, 72, 66, 96], true)] },
    caption: "腕を振ってリズムよく歩く",
  },
  stretch: {
    context: "floor", single: true,
    start: { head: [48, 12], dumbbell: null, lines: [L([50, 20, 50, 52], false), L([40, 20, 38, 46], false), L([50, 52, 44, 96], false), L([50, 52, 56, 96], false), L([60, 20, 86, 5], true)] },
    caption: "反動をつけずゆっくり伸ばす",
  },
};

function toPoints(p) {
  const out = [];
  for (let i = 0; i < p.length; i += 2) out.push(`${p[i]},${p[i + 1]}`);
  return out.join(" ");
}

function motionArrow(ln) {
  // Derive a direction arrow from the last two points of the "moving" line's chain.
  const p = ln.p;
  const n = p.length;
  if (n < 4) return null;
  const [x1, y1, x2, y2] = [p[n - 4], p[n - 3], p[n - 2], p[n - 1]];
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
  const rotation = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return { x: x2, y: y2, rotation };
}

function BodyFrame({ frame, color, showArrow = false, size = 84 }) {
  const skin = "#AEBBCF"; // neutral, flat "mannequin" tone for limbs/head
  const arrow = showArrow ? motionArrow(frame.lines.find((ln) => ln.m) || {}) : null;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {frame.lines.map((ln, i) => (
        <polyline
          key={i}
          points={toPoints(ln.p)}
          fill="none"
          stroke={ln.m ? color : skin}
          strokeWidth={ln.m ? 10 : 9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <circle cx={frame.head[0]} cy={frame.head[1]} r="8.5" fill={skin} stroke="#0B1120" strokeWidth="2" />
      {frame.dumbbell && (
        <rect x={frame.dumbbell[0] - 7} y={frame.dumbbell[1] - 3} width="14" height="6" rx="2" fill="#475569" stroke={color} strokeWidth="1.5" />
      )}
      {arrow && (
        <polygon
          points="0,-6.5 5.5,4.5 -5.5,4.5"
          fill={color}
          transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.rotation})`}
        />
      )}
    </svg>
  );
}

function BodyContext({ type }) {
  if (type === "floor") {
    return <div style={{ position: "absolute", left: 6, right: 6, bottom: 5, height: 2, background: "#1E293B", borderRadius: 2 }} />;
  }
  if (type === "bench") {
    return <div style={{ position: "absolute", left: 10, right: 16, bottom: 26, height: 7, background: "#1E293B", borderRadius: 3 }} />;
  }
  if (type === "inclineBench") {
    return (
      <div style={{
        position: "absolute", left: 10, bottom: 14, width: 62, height: 8,
        background: "#1E293B", borderRadius: 3, transform: "rotate(-30deg)", transformOrigin: "0% 100%",
      }} />
    );
  }
  if (type === "box") {
    return <div style={{ position: "absolute", right: 8, bottom: 4, width: 20, height: 14, background: "#1E293B", borderRadius: 3 }} />;
  }
  if (type === "rearBox") {
    return <div style={{ position: "absolute", right: 4, bottom: 24, width: 22, height: 7, background: "#1E293B", borderRadius: 3 }} />;
  }
  return null;
}

function BodyIllustration({ poseKey, color }) {
  const pose = BODY[poseKey];
  if (!pose) return null;
  if (pose.single) {
    return (
      <div>
        <div className="flex flex-col items-center">
          <div className="relative rounded-xl overflow-hidden" style={{ background: "#0B1120", border: `1px solid ${color}55` }}>
            <BodyContext type={pose.context} />
            <BodyFrame frame={pose.start} color={color} />
          </div>
          <span className="text-[10px] mt-1" style={{ color }}>この姿勢をキープ</span>
        </div>
        <p className="text-[11px] text-center mt-1.5" style={{ color: "#94A3B8" }}>{pose.caption}</p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center">
          <div className="relative rounded-xl overflow-hidden" style={{ background: "#0B1120", border: "1px solid #1E293B" }}>
            <BodyContext type={pose.context} />
            <BodyFrame frame={pose.start} color="#64748B" />
          </div>
          <span className="text-[10px] mt-1" style={{ color: "#64748B" }}>開始</span>
        </div>
        <ChevronRight size={16} color="#64748B" style={{ flexShrink: 0 }} />
        <div className="flex flex-col items-center">
          <div className="relative rounded-xl overflow-hidden" style={{ background: "#0B1120", border: `1px solid ${color}77` }}>
            <BodyContext type={pose.context} />
            <BodyFrame frame={pose.end} color={color} showArrow />
          </div>
          <span className="text-[10px] mt-1" style={{ color }}>動作</span>
        </div>
      </div>
      <p className="text-[11px] mt-1.5" style={{ color: "#94A3B8" }}>{pose.caption}</p>
    </div>
  );
}

/* ---------- helpers ---------- */

function getWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const weekNum =
    1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

const TOTAL_SETS = DAYS.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0);

function dayDefForDate(date) {
  return DAYS[(date.getDay() + 6) % 7];
}

function completionForDate(date, weekCache) {
  const dayDef = dayDefForDate(date);
  const total = dayDef.exercises.reduce((s, e) => s + e.sets, 0);
  const wk = getWeekKey(date);
  const data = weekCache[wk]?.[dayDef.key] || {};
  const done = dayDef.exercises.reduce((s, e) => s + (data[e.id]?.filter(Boolean).length || 0), 0);
  return { dayDef, total, done, pct: total ? done / total : 0 };
}

function monthGridDates(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // days since Monday
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function weekKeysForYear(year) {
  const keys = new Set();
  for (let m = 0; m < 12; m++) {
    monthGridDates(new Date(year, m, 1)).forEach((d) => keys.add(getWeekKey(d)));
  }
  return [...keys];
}

/* ---------- V2 helpers ---------- */
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function previousWeekKeys(count = 8) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    out.push(getWeekKey(d));
    d.setDate(d.getDate() - 7);
  }
  return out;
}

function firstIncompleteExercise(dayDef, progress) {
  const dd = progress?.[dayDef.key] || {};
  return dayDef.exercises.find((e) => {
    const arr = dd[e.id] || [];
    return arr.filter(Boolean).length < e.sets;
  }) || null;
}


/* ---------- V3 helpers ---------- */
function parseKg(weight) {
  if (!weight) return 0;
  const m = String(weight).match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

function estimateMinutes(detail, cardio = false) {
  if (!detail) return cardio ? 10 : 3;
  const m = String(detail).match(/(\d+)(?:〜(\d+))?\s*分/);
  if (m) return Number(m[2] || m[1]);
  const sets = String(detail).match(/(\d+)\s*(?:回|秒)/);
  if (sets) return String(detail).includes("秒") ? Math.max(1, Number(sets[1]) / 60) : Math.max(2, Number(sets[1]) / 6);
  return cardio ? 10 : 3;
}

function estimateCaloriesForDay(dayDef, progress, bodyWeight = 75) {
  const dd = progress?.[dayDef.key] || {};
  let minutes = 0;
  dayDef.exercises.forEach((e) => {
    const done = (dd[e.id] || []).filter(Boolean).length;
    if (!done) return;
    const base = estimateMinutes(e.detail, e.cardio);
    minutes += e.sets ? Math.max(1, base * done / e.sets) : base;
  });
  const title = dayDef.title;
  const met = /有酸素|ウォーキング/.test(title) ? 5 : /サーキット/.test(title) ? 6.5 : /休養/.test(title) ? 1.5 : 4.5;
  return Math.round(met * bodyWeight * 0.0175 * minutes);
}

function getProgressDayDone(dayDef, progress) {
  const dd = progress?.[dayDef.key] || {};
  return dayDef.exercises.reduce((sum, e) => sum + (dd[e.id]?.filter(Boolean).length || 0), 0);
}

function completedDayKeys(weekCache) {
  const out = new Set();
  Object.entries(weekCache || {}).forEach(([wk, data]) => {
    DAYS.forEach((d) => {
      if (getProgressDayDone(d, data) > 0) out.add(`${wk}:${d.key}`);
    });
  });
  return out;
}

function formatWeekLabel(wk) {
  return String(wk || "").replace("-W", " / W");
}

function WeightTrendChart({ history }) {
  const rows = [...history]
    .filter((r) => r.weight !== "" && Number.isFinite(Number(r.weight)))
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
    .slice(-12);
  if (rows.length < 2) {
    return (
      <div className="rounded-xl p-4 text-center text-xs" style={{ background:"#0B1120", border:"1px solid #1E293B", color:"#64748B" }}>
        体重を2週以上記録すると推移グラフが表示されます
      </div>
    );
  }
  const vals = rows.map((r) => Number(r.weight));
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const W = 320, H = 120, px = 18, py = 16;
  const points = vals.map((v, i) => {
    const x = px + (i * (W - px * 2)) / Math.max(1, vals.length - 1);
    const y = H - py - ((v - min) / Math.max(0.1, max - min)) * (H - py * 2);
    return [x, y];
  });
  const poly = points.map(([x,y]) => `${x},${y}`).join(" ");
  const diff = vals[vals.length - 1] - vals[0];
  return (
    <div className="rounded-xl p-3" style={{ background:"#0B1120", border:"1px solid #1E293B" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px]" style={{color:"#64748B"}}>直近{rows.length}週の体重</span>
        <span className="text-xs font-bold flex items-center gap-1" style={{color: diff <= 0 ? "#4ADE80" : "#F87171"}}>
          {diff <= 0 ? <ArrowDown size={12}/> : <ArrowUp size={12}/>}
          {Math.abs(diff).toFixed(1)}kg
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="120" role="img" aria-label="体重推移グラフ">
        <polyline points={poly} fill="none" stroke="#F5B942" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map(([x,y], i) => <g key={i}><circle cx={x} cy={y} r="4" fill="#F5B942"/><text x={x} y={y-8} textAnchor="middle" fontSize="9" fill="#CBD5E1">{vals[i]}</text></g>)}
      </svg>
      <div className="flex justify-between text-[9px]" style={{color:"#475569"}}>
        <span>{formatWeekLabel(rows[0].weekKey)}</span><span>{formatWeekLabel(rows[rows.length-1].weekKey)}</span>
      </div>
    </div>
  );
}

function V3Metric({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-xl p-3" style={{background:"#131B2E", border:"1px solid #1E293B"}}>
      <div className="flex items-center gap-1.5">
        <Icon size={13} color={color}/>
        <span className="text-[10px]" style={{color:"#64748B"}}>{label}</span>
      </div>
      <div className="text-lg font-bold mt-1" style={{color:"#F1F5F9"}}>{value}</div>
      {sub && <div className="text-[9px] mt-0.5" style={{color:"#64748B"}}>{sub}</div>}
    </div>
  );
}

/* ---------- app ---------- */

// Specific, real reference videos (verified via search) for exercises where form
// really matters. Falls back to a YouTube search link for the rest (walking,
// stretching, rest days) where a single fixed video isn't essential.
const VIDEO = {
  m1: "https://www.youtube.com/watch?v=rW1eYZAX_M8",
  m2: "https://www.youtube.com/watch?v=HxoDY_0vEnQ",
  m3: "https://www.youtube.com/watch?v=ARdYEdJJlDA",
  m4: "https://www.youtube.com/watch?v=dCOXrGCEl1U",
  m5: "https://www.youtube.com/watch?v=-6RgImf9l34",
  m6: "https://www.youtube.com/watch?v=lCEI5x7ATtE",
  t1: "https://www.youtube.com/watch?v=YMlhhmdTPXE",
  t2: "https://www.youtube.com/watch?v=EKQ4p8ogZkI",
  t3: "https://www.youtube.com/watch?v=GCN-Y8hJWQo",
  t4: "https://www.youtube.com/watch?v=rH6JEbdVFuY",
  t5: "https://www.youtube.com/watch?v=ufg377G-Cws",
  h1: "https://www.youtube.com/watch?v=KuYfXMNQgRI",
  h2: "https://www.youtube.com/watch?v=SOjm0LZ86pY",
  h3: "https://www.youtube.com/watch?v=VGH-N087vrU",
  h4: "https://www.youtube.com/watch?v=7UmhY40g0EM",
  h5: "https://www.youtube.com/watch?v=R9gZHq9o5b4",
  h6: "https://www.youtube.com/watch?v=y_sZA8ixCBw",
  f1: "https://www.youtube.com/watch?v=rW1eYZAX_M8",
  f2: "https://www.youtube.com/watch?v=Wjp7V0EK0Zg",
  f3: "https://www.youtube.com/watch?v=KuYfXMNQgRI",
  f4: "https://www.youtube.com/watch?v=dCOXrGCEl1U",
  f5: "https://www.youtube.com/watch?v=UgkU2S8VUX4",
};

const ytUrl = (name, id) => VIDEO[id] || `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " やり方 初心者")}`;

export default function App() {
  const weekKey = useMemo(() => getWeekKey(new Date()), []);
  const [progress, setProgress] = useState(null); // { mon: {m1:[t,f,t], ...}, ... }
  const [measurements, setMeasurements] = useState({ weight: "", waist: "", chest: "", arm: "", thigh: "" });
  const [dayIndex, setDayIndex] = useState(() => {
    const jsDay = new Date().getDay(); // 0=Sun
    return jsDay === 0 ? 6 : jsDay - 1;
  });
  const [showMeasure, setShowMeasure] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [viewMode, setViewMode] = useState("day"); // 'day' | 'week' | 'month' | 'year'
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekCache, setWeekCache] = useState({}); // weekKey -> progress data for that week
  const [measurementHistory, setMeasurementHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [toast, setToast] = useState("");
  const [workoutMode, setWorkoutMode] = useState(false);
  const [workoutExIndex, setWorkoutExIndex] = useState(0);
  const [workoutSetIndex, setWorkoutSetIndex] = useState(0);
  const [showV3Stats, setShowV3Stats] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    setIsStandalone(standalone);
    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      setToast("ホーム画面に追加しました 🎉");
      setTimeout(() => setToast(""), 2400);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // The browser may reject or dismiss the prompt.
    } finally {
      setInstallPrompt(null);
    }
  }, [installPrompt]);
  const todayIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const loadingRef = useRef(new Set());
  const weekCacheRef = useRef({});
  weekCacheRef.current = weekCache;
  const ensureWeeksLoaded = useCallback((keys) => {
    const toFetch = keys.filter((k) => !weekCacheRef.current[k] && !loadingRef.current.has(k));
    if (toFetch.length === 0) return;
    toFetch.forEach((k) => loadingRef.current.add(k));
    toFetch.forEach(async (k) => {
      let data = {};
      try {
        const res = await storage.get(`progress:${k}`);
        if (res) data = JSON.parse(res.value);
      } catch {
        data = {};
      }
      setWeekCache((prev) => ({ ...prev, [k]: data }));
    });
  }, []);

  useEffect(() => {
    ensureWeeksLoaded(previousWeekKeys(12));
  }, [ensureWeeksLoaded]);

  // Keep this week's live edits reflected immediately in the cache used by month/year views
  useEffect(() => {
    if (progress) setWeekCache((prev) => ({ ...prev, [weekKey]: progress }));
  }, [progress, weekKey]);

  useEffect(() => {
    if (!restRunning || restSeconds <= 0) return;
    const id = setInterval(() => {
      setRestSeconds((v) => {
        if (v <= 1) {
          clearInterval(id);
          setRestRunning(false);
          setToast("休憩終了！次のセットへ 💪");
          setTimeout(() => setToast(""), 2200);
          try {
            navigator.vibrate?.([120, 80, 120]);
          } catch {
            /* vibration unsupported — toast is still shown */
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restRunning, restSeconds]);

  const startRest = useCallback((seconds = 60) => {
    setRestSeconds(seconds);
    setRestRunning(true);
  }, []);

  const resetRest = useCallback(() => {
    setRestRunning(false);
    setRestSeconds(0);
  }, []);

  const formatTimer = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const weekDates = useMemo(() => {
    const now = new Date();
    const offset = (now.getDay() + 6) % 7; // Mon=0
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    return DAYS.map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const day = DAYS[dayIndex];

  useEffect(() => {
    let finished = false;
    const safetyNet = setTimeout(() => {
      if (!finished) setLoaded(true); // never leave the user stuck on "読み込み中"
    }, 6000);
    (async () => {
      try {
        const res = await storage.get(`progress:${weekKey}`);
        setProgress(res ? JSON.parse(res.value) : {});
      } catch {
        setProgress({});
      }
      try {
        const res = await storage.get(`measurements:${weekKey}`);
        if (res) setMeasurements(JSON.parse(res.value));
      } catch {
        /* no data yet */
      }
      try {
        const keys = previousWeekKeys(12);
        const results = await Promise.all(
          keys.map(async (k) => {
            try {
              const r = await storage.get(`measurements:${k}`);
              return r?.value ? { weekKey: k, ...JSON.parse(r.value) } : null;
            } catch {
              return null;
            }
          })
        );
        setMeasurementHistory(results.filter(Boolean));
      } catch {
        setMeasurementHistory([]);
      }
      finished = true;
      clearTimeout(safetyNet);
      setLoaded(true);
    })();
    return () => clearTimeout(safetyNet);
  }, [weekKey]);

  const persistProgress = useCallback(
    async (next) => {
      setProgress(next);
      try {
        await storage.set(`progress:${weekKey}`, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [weekKey]
  );

  const openYoutube = async (name, id) => {
    const url = ytUrl(name, id);
    let win = null;
    try {
      win = window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      win = null;
    }
    if (!win) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* clipboard unavailable — the visible URL text below still lets the user copy manually */
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 3000);
    }
  };

  const toggleSet = (dayKey, exId, setIdx, totalSets) => {
    if (!progress) return;
    const dayData = { ...(progress[dayKey] || {}) };
    const current = dayData[exId] ? [...dayData[exId]] : Array(totalSets).fill(false);
    current[setIdx] = !current[setIdx];
    dayData[exId] = current;
    persistProgress({ ...progress, [dayKey]: dayData });
  };

  const saveMeasurements = async () => {
    try {
      await storage.set(`measurements:${weekKey}`, JSON.stringify(measurements));
      setMeasurementHistory((prev) => [
        { weekKey, ...measurements },
        ...prev.filter((r) => r.weekKey !== weekKey),
      ].slice(0, 12));
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const weekStats = useMemo(() => {
    if (!progress) return { done: 0, total: TOTAL_SETS };
    let done = 0;
    DAYS.forEach((d) => {
      const dd = progress[d.key] || {};
      d.exercises.forEach((e) => {
        const arr = dd[e.id];
        if (arr) done += arr.filter(Boolean).length;
      });
    });
    return { done, total: TOTAL_SETS };
  }, [progress]);

  const dayStats = useMemo(() => {
    if (!progress) return { done: 0, total: 0 };
    const dd = progress[day.key] || {};
    let done = 0;
    let total = 0;
    day.exercises.forEach((e) => {
      total += e.sets;
      const arr = dd[e.id];
      if (arr) done += arr.filter(Boolean).length;
    });
    return { done, total };
  }, [progress, day]);

  const nextExercise = useMemo(() => firstIncompleteExercise(day, progress), [day, progress]);
  const todayDay = DAYS[todayIndex];
  const todayProgress = progress?.[todayDay.key] || {};
  const todayTotal = todayDay.exercises.reduce((s, e) => s + e.sets, 0);
  const todayDone = todayDay.exercises.reduce((s, e) => s + (todayProgress[e.id]?.filter(Boolean).length || 0), 0);
  const todayPct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;
  const pct = weekStats.total ? Math.round((weekStats.done / weekStats.total) * 100) : 0;
  const circumference = 2 * Math.PI * 26;
  const dashOffset = circumference - (pct / 100) * circumference;
  const bodyWeight = Number(measurements.weight) || 75;
  const todayCalories = estimateCaloriesForDay(todayDay, progress, bodyWeight);
  const weeklyCalories = DAYS.reduce((sum, d) => sum + estimateCaloriesForDay(d, progress, bodyWeight), 0);

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() - i);
      const wk = getWeekKey(d);
      const dd = weekCache[wk];
      if (!dd) break;
      if (getProgressDayDone(dayDefForDate(d), dd) > 0) count++;
      else if (i === 0) continue;
      else break;
    }
    return count;
  }, [weekCache]);

  const menuWeightRecords = useMemo(() => {
    const rows = [];
    DAYS.forEach((d) => {
      const dd = progress?.[d.key] || {};
      d.exercises.forEach((e) => {
        const done = (dd[e.id] || []).filter(Boolean).length;
        const kg = parseKg(e.weight);
        if (done > 0 && kg > 0) rows.push({ name: e.name, kg, done, day: d.jp });
      });
    });
    return rows.sort((a,b) => b.kg - a.kg).slice(0, 5);
  }, [progress]);

  const completeWorkoutSet = useCallback(() => {
    const ex = day.exercises[workoutExIndex];
    if (!ex || !progress) return;
    const current = progress?.[day.key]?.[ex.id] || [];
    if (!current[workoutSetIndex]) {
      toggleSet(day.key, ex.id, workoutSetIndex, ex.sets);
    }
    if (workoutSetIndex + 1 < ex.sets) {
      setWorkoutSetIndex((v) => v + 1);
      startRest(60);
      return;
    }
    if (workoutExIndex + 1 < day.exercises.length) {
      setWorkoutExIndex((v) => v + 1);
      setWorkoutSetIndex(0);
      startRest(60);
    } else {
      setToast("今日のメニュー完了！お疲れさまでした 🎉");
      setTimeout(() => setToast(""), 2500);
      setWorkoutMode(false);
    }
  }, [day, progress, workoutExIndex, workoutSetIndex, startRest]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B1120" }}>
        <div className="text-sm" style={{ color: "#94A3B8" }}>読み込み中…</div>
      </div>
    );
  }

  const Icon = day.icon;

  return (
    <div className="min-h-screen pb-28" style={{ background: "#0B1120", fontFamily: "'Hiragino Sans','Yu Gothic',system-ui,sans-serif" }}>
      {toast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] rounded-full px-4 py-2 text-xs font-bold shadow-lg" style={{ background: "#F5B942", color: "#0B1120" }}>
          {toast}
        </div>
      )}
      {/* Header */}
      <div className="px-5 pt-6 pb-4" style={{ background: "linear-gradient(180deg,#111A2E 0%, #0B1120 100%)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] tracking-widest" style={{ color: "#F5B942" }}>WEEKLY TRAINING · V4.2</div>
            <h1 className="text-xl font-bold mt-0.5" style={{ color: "#F1F5F9" }}>1週間トレーニングメニュー</h1>
            <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>ダイエット & ボディメイク</div>
          </div>
          {!isStandalone && (
            <button
              onClick={installApp}
              className="absolute right-20 top-6 rounded-xl px-3 py-2 text-[10px] font-bold z-10"
              style={{ background: "#F5B942", color: "#0B1120", boxShadow: "0 8px 24px #0006" }}
            >
              📲 アプリ化
            </button>
          )}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#1E293B" strokeWidth="6" />
              <circle
                cx="32" cy="32" r="26" fill="none" stroke="#F5B942" strokeWidth="6"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                strokeLinecap="round" transform="rotate(-90 32 32)"
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{pct}%</span>
            </div>
          </div>
        </div>

        {/* goal strip */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <GoalChip icon={Target} label="目標" value="75→69-70kg" color="#F87171" />
          <GoalChip icon={Flame} label="カロリー" value="2,000-2,200kcal" color="#F5B942" />
          <GoalChip icon={Beef} label="たんぱく質" value="120g前後" color="#5B8CFF" />
        </div>

        {/* view toggle */}
        <div className="grid grid-cols-4 mt-4 rounded-xl p-1 gap-1" style={{ background: "#131B2E" }}>
          {[
            { key: "day", label: "日", icon: ListIcon },
            { key: "week", label: "週", icon: CalendarDays },
            { key: "month", label: "月", icon: Calendar },
            { key: "year", label: "年", icon: CalendarRange },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setViewMode(v.key)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg py-2"
              style={{ background: viewMode === v.key ? "#F5B942" : "transparent", color: viewMode === v.key ? "#0B1120" : "#94A3B8" }}
            >
              <v.icon size={14} />
              <span className="text-[10px] font-semibold">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* V2 today dashboard */}
      {viewMode === "day" && (
        <div className="px-5 mt-3 space-y-2.5">
          <div className="rounded-2xl p-4" style={{ background: `linear-gradient(135deg, ${todayDay.color}20, #131B2E)`, border: `1px solid ${todayDay.color}55` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} color="#F5B942" />
                  <span className="text-[10px] font-bold tracking-wide" style={{ color: "#F5B942" }}>TODAY'S FOCUS</span>
                </div>
                <div className="text-base font-bold mt-1" style={{ color: "#F1F5F9" }}>{todayDay.title}</div>
                <div className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>{todayDone}/{todayTotal} セット完了 ・ {todayPct}%</div>
              </div>
              <button onClick={() => setDayIndex(todayIndex)} className="rounded-xl px-3 py-2 text-[11px] font-bold" style={{ background: todayDay.color, color: "#0B1120" }}>今日を開く</button>
              <button onClick={() => { setDayIndex(todayIndex); setWorkoutExIndex(0); setWorkoutSetIndex(0); setWorkoutMode(true); }} className="rounded-xl px-3 py-2 text-[11px] font-bold" style={{ background: "#F5B942", color: "#0B1120" }}>
                <Play size={12} className="inline mr-1"/>開始
              </button>
            </div>
            <div className="mt-3 h-1.5 rounded-full" style={{ background: "#0B1120" }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${todayPct}%`, background: todayDay.color }} />
            </div>
          </div>

          <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "#131B2E", border: "1px solid #1E293B" }}>
            <div className="rounded-xl flex items-center justify-center" style={{ width: 40, height: 40, background: "#0B1120" }}><Timer size={18} color="#F5B942" /></div>
            <div className="flex-1">
              <div className="text-[10px]" style={{ color: "#64748B" }}>休憩タイマー</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: restSeconds ? "#F5B942" : "#F1F5F9" }}>{formatTimer(restSeconds)}</div>
            </div>
            {restRunning ? (
              <button onClick={() => setRestRunning(false)} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#334155", color: "#F1F5F9" }}><Pause size={13} className="inline mr-1" />停止</button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={() => startRest(60)} className="rounded-lg px-2.5 py-2 text-xs font-bold" style={{ background: "#F5B942", color: "#0B1120" }}><Play size={13} className="inline mr-1" />60秒</button>
                <button onClick={() => startRest(90)} className="rounded-lg px-2.5 py-2 text-xs font-bold" style={{ background: "#334155", color: "#F1F5F9" }}>90秒</button>
              </div>
            )}
            <button onClick={resetRest} className="p-2 rounded-lg" style={{ background: "#0B1120" }}><RotateCcw size={14} color="#94A3B8" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <V3Metric icon={Activity} label="連続トレ日数" value={`${streak}日`} sub="過去30日" color="#4ADE80" />
            <V3Metric icon={Flame} label="今週の消費目安" value={`${weeklyCalories}`} sub="kcal（概算）" color="#F5B942" />
            <V3Metric icon={Gauge} label="今日の消費目安" value={`${todayCalories}`} sub="kcal（概算）" color="#F87171" />
          </div>
          <button onClick={() => setShowV3Stats((v) => !v)} className="w-full rounded-xl px-4 py-3 flex items-center justify-between" style={{background:"#131B2E", border:"1px solid #1E293B"}}>
            <div className="flex items-center gap-2"><BarChart3 size={15} color="#5B8CFF"/><span className="text-xs font-bold" style={{color:"#F1F5F9"}}>V3進捗ダッシュボード</span></div>
            <ChevronDown size={14} color="#64748B" style={{transform: showV3Stats ? "rotate(180deg)" : "none"}}/>
          </button>
          {showV3Stats && (
            <div className="rounded-2xl p-4 space-y-3" style={{background:"#131B2E", border:"1px solid #1E293B"}}>
              <WeightTrendChart history={measurementHistory} />
              <div>
                <div className="flex items-center gap-1.5 mb-2"><Trophy size={14} color="#F5B942"/><span className="text-xs font-bold" style={{color:"#F1F5F9"}}>今週の高重量メニュー</span></div>
                {menuWeightRecords.length === 0 ? (
                  <div className="text-[11px]" style={{color:"#64748B"}}>種目を1セット以上完了すると表示されます</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5">
                    {menuWeightRecords.map((r) => (
                      <div key={`${r.day}-${r.name}`} className="flex items-center justify-between rounded-lg px-3 py-2" style={{background:"#0B1120"}}>
                        <span className="text-[11px]" style={{color:"#CBD5E1"}}>{r.day}・{r.name}</span>
                        <span className="text-xs font-bold" style={{color:"#F5B942"}}>{r.kg}kg</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="text-[9px] mt-2" style={{color:"#64748B"}}>※「自己ベスト」は実測PRではなく、現在のメニュー設定重量を基準にした参考値です。</div>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === "week" && (
        <WeekCalendar
          progress={progress}
          weekDates={weekDates}
          onSelectDay={(i) => { setDayIndex(i); setViewMode("day"); }}
        />
      )}

      {viewMode === "month" && (
        <MonthCalendar
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          weekCache={weekCache}
          ensureWeeksLoaded={ensureWeeksLoaded}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          weekKey={weekKey}
          onEditToday={(i) => { setDayIndex(i); setViewMode("day"); }}
        />
      )}

      {viewMode === "year" && (
        <YearCalendar
          calendarYear={calendarYear}
          setCalendarYear={setCalendarYear}
          weekCache={weekCache}
          ensureWeeksLoaded={ensureWeeksLoaded}
          onJumpToMonth={(m) => { setCalendarMonth(m); setViewMode("month"); }}
        />
      )}

      {viewMode === "day" && (
      <>
      {/* Day switcher */}
      <div className="px-5 mt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {DAYS.map((d, i) => {
            const active = i === dayIndex;
            const dd = progress?.[d.key] || {};
            const total = d.exercises.reduce((s, e) => s + e.sets, 0);
            const done = d.exercises.reduce((s, e) => s + (dd[e.id]?.filter(Boolean).length || 0), 0);
            const complete = total > 0 && done === total;
            return (
              <button
                key={d.key}
                onClick={() => setDayIndex(i)}
                className="flex flex-col items-center justify-center flex-shrink-0 rounded-2xl"
                style={{
                  width: 46, height: 54,
                  background: active ? d.color : "#131B2E",
                  border: `1px solid ${active ? d.color : "#1E293B"}`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: active ? "#0B1120" : "#CBD5E1" }}>{d.jp}</span>
                <span
                  className="mt-1 rounded-full"
                  style={{
                    width: 6, height: 6,
                    background: complete ? (active ? "#0B1120" : d.color) : "transparent",
                    border: complete ? "none" : `1px solid ${active ? "#0B112055" : "#334155"}`,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Day header card */}
      <div className="px-5 mt-4">
        <div className="rounded-2xl px-4 py-3 flex items-center justify-between" style={{ background: `${day.color}1A`, border: `1px solid ${day.color}55` }}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl flex items-center justify-center" style={{ width: 40, height: 40, background: day.color }}>
              <Icon size={20} color="#0B1120" />
            </div>
            <div>
              <div className="text-[11px]" style={{ color: day.color }}>{day.full}</div>
              <div className="text-base font-bold" style={{ color: "#F1F5F9" }}>{day.title}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{dayStats.done}/{dayStats.total}</div>
              <div className="text-[10px]" style={{ color: "#94A3B8" }}>完了セット</div>
            </div>
            <button onClick={() => { setWorkoutExIndex(0); setWorkoutSetIndex(0); setWorkoutMode(true); }} className="rounded-xl px-3 py-2 text-[10px] font-bold" style={{background:day.color, color:"#0B1120"}}>
              <Play size={12} className="inline mr-1"/>開始
            </button>
          </div>
        </div>
        {day.note && (
          <div className="mt-2 text-xs px-1" style={{ color: day.color }}>◎ {day.note}</div>
        )}
        {nextExercise && (
          <button
            onClick={() => setExpanded((e) => ({ ...e, [nextExercise.id]: true }))}
            className="w-full mt-2.5 rounded-xl px-3 py-2.5 text-left flex items-center gap-2"
            style={{ background: "#0B1120", border: `1px solid ${day.color}44` }}
          >
            <DumbbellIcon size={15} color={day.color} />
            <div className="flex-1 min-w-0"><div className="text-[10px]" style={{ color: "#64748B" }}>次にやる種目</div><div className="text-xs font-bold truncate" style={{ color: "#F1F5F9" }}>{nextExercise.name}</div></div>
            <span className="text-[10px] font-bold" style={{ color: day.color }}>フォームを見る →</span>
          </button>
        )}
      </div>

      {/* Exercise list */}
      <div className="px-5 mt-3 space-y-2.5">
        {day.exercises.map((ex, idx) => {
          const arr = progress?.[day.key]?.[ex.id] || Array(ex.sets).fill(false);
          const done = arr.filter(Boolean).length;
          const full = done === ex.sets;
          const isOpen = !!expanded[ex.id];
          return (
            <div
              key={ex.id}
              className="rounded-2xl px-4 py-3"
              style={{ background: "#131B2E", border: `1px solid ${full ? day.color + "77" : "#1E293B"}` }}
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setExpanded((e) => ({ ...e, [ex.id]: !e[ex.id] }))}
                >
                  <div className="flex items-center gap-1.5">
                    {!ex.cardio && (
                      <span
                        className="text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ width: 16, height: 16, background: day.color, color: "#0B1120" }}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <span className="text-sm font-semibold truncate" style={{ color: "#F1F5F9" }}>{ex.name}</span>
                    {ex.howto && (
                      <ChevronDown
                        size={13}
                        color="#64748B"
                        style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                      />
                    )}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                    {ex.weight ? `${ex.weight} ・ ` : ""}{ex.detail}
                  </div>
                </button>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {arr.map((checked, si) => (
                    <button
                      key={si}
                      onClick={() => toggleSet(day.key, ex.id, si, ex.sets)}
                      className="rounded-lg flex items-center justify-center"
                      style={{
                        width: 28, height: 28,
                        background: checked ? day.color : "transparent",
                        border: `1.5px solid ${checked ? day.color : "#334155"}`,
                      }}
                    >
                      {checked && <Check size={15} color="#0B1120" strokeWidth={3} />}
                    </button>
                  ))}
                  {ex.sets > 1 && !full && (
                    <button
                      onClick={() => persistProgress({ ...progress, [day.key]: { ...(progress[day.key] || {}), [ex.id]: Array(ex.sets).fill(true) } })}
                      className="rounded-lg p-1.5"
                      title="この種目を完了"
                      style={{ background: "#0B1120", border: "1px solid #334155" }}
                    ><CheckCheck size={14} color="#94A3B8" /></button>
                  )}
                </div>
              </div>
              {isOpen && ex.howto && (
                <div
                  className="mt-2.5 pt-2.5 space-y-2.5"
                  style={{ borderTop: "1px solid #1E293B" }}
                >
                  {ex.pose && BODY[ex.pose] && <BodyIllustration poseKey={ex.pose} color={day.color} />}
                  <div className="flex gap-1.5 min-w-0">
                    <BookOpen size={13} color={day.color} style={{ flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs leading-relaxed" style={{ color: "#CBD5E1" }}>{ex.howto}</p>
                  </div>
                  <FormCheckBlock name={ex.name} color={day.color} />
                  {!ex.rest && (
                    <div>
                      <button
                        onClick={() => openYoutube(ex.name, ex.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                        style={{ background: copiedId === ex.id ? "#22C55E" : "#FF0000", color: "#fff" }}
                      >
                        {copiedId === ex.id ? <Copy size={14} /> : <Youtube size={14} />}
                        {copiedId === ex.id ? "URLをコピーしました" : "YouTubeで動画を見る"}
                      </button>
                      <p className="text-[10px] mt-1.5" style={{ color: "#475569" }}>
                        開かない場合はこのURLをタップでコピー、または長押しでコピー：
                      </p>
                      <p
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(ytUrl(ex.name, ex.id));
                            setCopiedId(ex.id);
                            setTimeout(() => setCopiedId((cur) => (cur === ex.id ? null : cur)), 3000);
                          } catch {
                            /* selection/long-press below still works as a manual fallback */
                          }
                        }}
                        className="text-[10px] mt-1 leading-relaxed break-all rounded-lg px-2 py-1.5"
                        style={{ color: "#64748B", background: "#0B1120", border: "1px solid #1E293B", WebkitUserSelect: "all", userSelect: "all" }}
                      >
                        {ytUrl(ex.name, ex.id)}
                      </p>
                    </div>
                  )}
                  {ex.alt && <AltExerciseChip alt={ex.alt} color={day.color} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {day.indoorAlt && (
        <div className="px-5 mt-3">
          <IndoorAltBlock items={day.indoorAlt} color={day.color} />
        </div>
      )}

      {/* extra info blocks */}
      <div className="px-5 mt-5 space-y-3">
        <InfoBlock title="ウォーミングアップ（毎回5分）" items={WARMUP} color="#F5B942" />
        <InfoBlock title="クールダウン・ストレッチ（各30秒）" items={COOLDOWN} color="#4ADE80" />
        <div className="rounded-2xl px-4 py-3" style={{ background: "#131B2E", border: "1px solid #1E293B" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Info size={14} color="#F5B942" />
            <span className="text-xs font-bold" style={{ color: "#F1F5F9" }}>トレーニングのポイント</span>
          </div>
          {POINTS.map((p, i) => (
            <div key={i} className="text-xs mb-1 leading-relaxed" style={{ color: "#94A3B8" }}>✓ {p}</div>
          ))}
          <div className="text-xs mt-2 leading-relaxed" style={{ color: "#94A3B8" }}>
            使用ダンベル：可変式ダンベル10kgまで×2個。「10回前後で限界がくる重さ」を目安に設定。
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowMeasure(true)}
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: "#131B2E", border: "1px solid #1E293B" }}
        >
          <div className="flex items-center gap-2">
            <Ruler size={16} color="#F5B942" />
            <span className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>毎週記録（体重・サイズ）</span>
          </div>
          <ChevronRight size={16} color="#94A3B8" />
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="rounded-2xl px-4 py-3 flex items-center justify-between"
          style={{ background: "#131B2E", border: "1px solid #1E293B" }}
        >
          <div className="flex items-center gap-2"><History size={16} color="#5B8CFF" /><span className="text-sm font-semibold" style={{ color: "#F1F5F9" }}>記録履歴</span></div>
          <ChevronRight size={16} color="#94A3B8" />
        </button>
        </div>
        <div className="text-center text-[11px] pt-1 pb-4" style={{ color: "#64748B" }}>
          小さな積み重ねが大きな変化をつくります。継続が力なり！ 目標：3か月後に69〜70kg
        </div>
      </div>

      {/* Bottom nav arrows */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-3 flex items-center justify-between" style={{ background: "#0B1120E6", borderTop: "1px solid #1E293B", backdropFilter: "blur(6px)" }}>
        <button
          onClick={() => setDayIndex((i) => (i + 6) % 7)}
          className="flex items-center gap-1 rounded-xl px-3 py-2"
          style={{ background: "#131B2E", color: "#CBD5E1" }}
        >
          <ChevronLeft size={16} /> <span className="text-xs">{DAYS[(dayIndex + 6) % 7].full}</span>
        </button>
        <div className="text-xs font-semibold" style={{ color: day.color }}>{day.full}</div>
        <button
          onClick={() => setDayIndex((i) => (i + 1) % 7)}
          className="flex items-center gap-1 rounded-xl px-3 py-2"
          style={{ background: "#131B2E", color: "#CBD5E1" }}
        >
          <span className="text-xs">{DAYS[(dayIndex + 1) % 7].full}</span> <ChevronRight size={16} />
        </button>
      </div>
      </>
      )}

      {/* Measurement history modal */}
      {showHistory && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "#000000AA" }} onClick={() => setShowHistory(false)}>
          <div className="w-full rounded-t-3xl px-5 pt-4 pb-8 max-h-[75vh] overflow-y-auto" style={{ background: "#111A2E", maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>測定記録の履歴</span><button onClick={() => setShowHistory(false)}><X size={18} color="#94A3B8" /></button></div>
            <WeightTrendChart history={measurementHistory} />
            {measurementHistory.length === 0 ? <div className="text-center py-8 text-xs" style={{ color: "#64748B" }}>まだ記録がありません</div> : (
              <div className="space-y-2 mt-3">
                {measurementHistory.map((r) => (
                  <div key={r.weekKey} className="rounded-xl p-3" style={{ background: "#0B1120", border: "1px solid #1E293B" }}>
                    <div className="flex items-center justify-between"><span className="text-xs font-bold" style={{ color: "#F5B942" }}>{r.weekKey}</span>{r.weight && <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{r.weight} kg</span>}</div>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]" style={{ color: "#94A3B8" }}>
                      <span>腹囲 {r.waist || "—"}</span><span>胸囲 {r.chest || "—"}</span><span>腕囲 {r.arm || "—"}</span><span>太もも {r.thigh || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showInstallHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5" style={{ background: "#050914F5" }} onClick={() => setShowInstallHelp(false)}>
          <div className="w-full max-w-md rounded-3xl p-5" style={{ background: "#111A2E", border: "1px solid #334155" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] tracking-widest" style={{ color: "#F5B942" }}>INSTALL APP</div>
                <div className="text-lg font-bold mt-1" style={{ color: "#F1F5F9" }}>ホーム画面に追加</div>
              </div>
              <button onClick={() => setShowInstallHelp(false)} className="p-2 rounded-xl" style={{ background: "#0B1120" }}><X size={18} color="#94A3B8" /></button>
            </div>
            <div className="mt-4 space-y-3 text-xs leading-relaxed" style={{ color: "#CBD5E1" }}>
              <div className="rounded-2xl p-3" style={{ background: "#0B1120", border: "1px solid #1E293B" }}>
                <b style={{ color: "#F1F5F9" }}>Android / Chrome</b><br/>ブラウザのメニュー「︙」→「ホーム画面に追加」または「アプリをインストール」を選択してください。
              </div>
              <div className="rounded-2xl p-3" style={{ background: "#0B1120", border: "1px solid #1E293B" }}>
                <b style={{ color: "#F1F5F9" }}>iPhone / Safari</b><br/>共有ボタン →「ホーム画面に追加」を選択してください。
              </div>
              <p style={{ color: "#64748B" }}>Chromeで「アプリをインストール」が表示されない場合でも、公開直後はService Workerの更新に少し時間がかかることがあります。ページを再読み込みしてから、Chromeの「︙」メニューを確認してください。</p>
            </div>
            <button onClick={() => setShowInstallHelp(false)} className="w-full mt-4 rounded-xl py-3 text-sm font-bold" style={{ background: "#F5B942", color: "#0B1120" }}>閉じる</button>
          </div>
        </div>
      )}

      {/* V4 workout mode */}
      {workoutMode && (() => {
        const ex = day.exercises[workoutExIndex];
        const arr = progress?.[day.key]?.[ex?.id] || [];
        const completed = arr.filter(Boolean).length;
        const currentSetDone = !!arr[workoutSetIndex];
        if (!ex) return null;
        return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" style={{background:"#050914F5"}}>
            <div className="w-full max-w-md rounded-3xl p-5" style={{background:"#111A2E", border:"1px solid #334155"}}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] tracking-widest" style={{color:"#F5B942"}}>WORKOUT MODE</div>
                  <div className="text-sm font-bold mt-1" style={{color:"#F1F5F9"}}>{day.full} ・ {workoutExIndex + 1}/{day.exercises.length}</div>
                </div>
                <button onClick={() => setWorkoutMode(false)} className="p-2 rounded-xl" style={{background:"#0B1120"}}><X size={18} color="#94A3B8"/></button>
              </div>
              <div className="mt-5 rounded-2xl p-4" style={{background:`${day.color}18`, border:`1px solid ${day.color}55`}}>
                <div className="text-xl font-bold" style={{color:"#F1F5F9"}}>{ex.name}</div>
                <div className="text-xs mt-1" style={{color:"#94A3B8"}}>{ex.detail}{ex.weight ? ` ・ ${ex.weight}` : ""}</div>
                <div className="mt-4"><BodyIllustration poseKey={ex.pose} color={day.color}/></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <V3Metric icon={CircleDot} label="現在セット" value={`${workoutSetIndex + 1}/${ex.sets}`} color={day.color}/>
                <V3Metric icon={CheckCheck} label="この種目" value={`${completed}/${ex.sets}`} color="#4ADE80"/>
                <V3Metric icon={Timer} label="休憩" value={formatTimer(restSeconds)} color="#F5B942"/>
              </div>
              <button
                disabled={currentSetDone}
                onClick={completeWorkoutSet}
                className="w-full mt-4 rounded-2xl py-4 text-sm font-bold"
                style={{background: currentSetDone ? "#334155" : day.color, color:"#0B1120"}}
              >
                {currentSetDone ? "このセットは完了済み ✓" : `セット${workoutSetIndex + 1}を完了する`}
              </button>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => startRest(60)} className="rounded-xl py-2.5 text-xs font-bold" style={{background:"#0B1120", color:"#CBD5E1", border:"1px solid #1E293B"}}><Timer size={13} className="inline mr-1"/>60秒休憩</button>
                <button onClick={() => { setWorkoutExIndex((v)=>Math.min(day.exercises.length-1,v+1)); setWorkoutSetIndex(0); }} className="rounded-xl py-2.5 text-xs font-bold" style={{background:"#0B1120", color:"#CBD5E1", border:"1px solid #1E293B"}}>種目をスキップ <ChevronRight size={13} className="inline"/></button>
              </div>
              {restSeconds > 0 && <div className="text-center text-[10px] mt-3" style={{color:"#F5B942"}}>{restRunning ? "休憩中…" : "一時停止中"} {formatTimer(restSeconds)}</div>}
            </div>
          </div>
        );
      })()}

      {/* Measurements modal */}
      {showMeasure && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "#000000AA" }} onClick={() => setShowMeasure(false)}>
          <div
            className="w-full rounded-t-3xl px-5 pt-4 pb-8"
            style={{ background: "#111A2E", maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>毎週記録（{weekKey}）</span>
              <button onClick={() => setShowMeasure(false)}><X size={18} color="#94A3B8" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: "weight", label: "体重", unit: "kg" },
                { key: "waist", label: "ウエスト", unit: "cm" },
                { key: "chest", label: "胸囲", unit: "cm" },
                { key: "arm", label: "腕囲", unit: "cm" },
                { key: "thigh", label: "太もも", unit: "cm" },
              ].map((f) => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#CBD5E1" }}>{f.label}</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={measurements[f.key]}
                      onChange={(e) => setMeasurements((m) => ({ ...m, [f.key]: e.target.value }))}
                      className="rounded-lg px-3 py-1.5 text-sm text-right"
                      style={{ width: 90, background: "#0B1120", border: "1px solid #334155", color: "#F1F5F9" }}
                      placeholder="0"
                    />
                    <span className="text-xs" style={{ color: "#64748B" }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={saveMeasurements}
              className="w-full mt-5 rounded-xl py-3 text-sm font-bold"
              style={{ background: "#F5B942", color: "#0B1120" }}
            >
              {saveFlash ? "保存しました ✓" : "保存する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WeekCalendar({ progress, weekDates, onSelectDay }) {
  const todayStr = new Date().toDateString();
  return (
    <div className="px-5 mt-4 pb-8 space-y-3">
      {DAYS.map((d, i) => {
        const dd = progress?.[d.key] || {};
        const total = d.exercises.reduce((s, e) => s + e.sets, 0);
        const done = d.exercises.reduce((s, e) => s + (dd[e.id]?.filter(Boolean).length || 0), 0);
        const pct = total ? Math.round((done / total) * 100) : 0;
        const date = weekDates[i];
        const isToday = date.toDateString() === todayStr;
        const DIcon = d.icon;
        return (
          <button
            key={d.key}
            onClick={() => onSelectDay(i)}
            className="w-full text-left rounded-2xl overflow-hidden"
            style={{ background: "#131B2E", border: `1px solid ${isToday ? d.color : "#1E293B"}` }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ width: 38 }}>
                <span className="text-[10px]" style={{ color: isToday ? d.color : "#64748B" }}>
                  {date.getMonth() + 1}/{date.getDate()}
                </span>
                <span className="text-sm font-bold" style={{ color: isToday ? d.color : "#CBD5E1" }}>{d.jp}</span>
              </div>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 34, height: 34, background: `${d.color}22` }}>
                <DIcon size={16} color={d.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#F1F5F9" }}>{d.title}</div>
                <div className="text-[11px] truncate" style={{ color: "#94A3B8" }}>
                  {d.exercises.map((e) => e.name).join("・")}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold" style={{ color: pct === 100 ? d.color : "#F1F5F9" }}>{done}/{total}</div>
                {isToday && <div className="text-[9px] mt-0.5" style={{ color: d.color }}>今日</div>}
              </div>
            </div>
            <div style={{ height: 3, background: "#0B1120" }}>
              <div style={{ height: 3, width: `${pct}%`, background: d.color, transition: "width 0.3s" }} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthCalendar({ calendarMonth, setCalendarMonth, weekCache, ensureWeeksLoaded, selectedDate, setSelectedDate, weekKey, onEditToday }) {
  const dates = useMemo(() => monthGridDates(calendarMonth), [calendarMonth]);
  useEffect(() => {
    ensureWeeksLoaded([...new Set(dates.map((d) => getWeekKey(d)))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarMonth]);

  const todayStr = new Date().toDateString();
  const monthLabel = `${calendarMonth.getFullYear()}年 ${calendarMonth.getMonth() + 1}月`;
  const detail = selectedDate ? completionForDate(selectedDate, weekCache) : null;
  const selectedIsCurrentWeek = selectedDate && getWeekKey(selectedDate) === weekKey;

  const changeMonth = (delta) => {
    const d = new Date(calendarMonth);
    d.setMonth(d.getMonth() + delta);
    setCalendarMonth(d);
    setSelectedDate(null);
  };

  return (
    <div className="px-5 mt-4 pb-8">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeMonth(-1)} className="rounded-lg p-1.5" style={{ background: "#131B2E" }}>
          <ChevronLeft size={16} color="#CBD5E1" />
        </button>
        <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="rounded-lg p-1.5" style={{ background: "#131B2E" }}>
          <ChevronRight size={16} color="#CBD5E1" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d.key} className="text-center text-[10px] font-semibold" style={{ color: d.color }}>{d.jp}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dates.map((date, i) => {
          const inMonth = date.getMonth() === calendarMonth.getMonth();
          const { dayDef, total, pct } = completionForDate(date, weekCache);
          const isToday = date.toDateString() === todayStr;
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const full = total > 0 && pct >= 1;
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(date)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
              style={{
                background: isSelected ? `${dayDef.color}33` : "#131B2E",
                border: `1px solid ${isToday ? "#F5B942" : isSelected ? dayDef.color : "#1E293B"}`,
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <span className="text-[11px]" style={{ color: "#F1F5F9" }}>{date.getDate()}</span>
              <span
                className="rounded-full mt-0.5"
                style={{
                  width: 6, height: 6,
                  background: full ? dayDef.color : "transparent",
                  border: full ? "none" : pct > 0 ? `2px solid ${dayDef.color}` : `1px solid #334155`,
                }}
              />
            </button>
          );
        })}
      </div>

      {detail && (
        <div className="mt-4 rounded-2xl px-4 py-3" style={{ background: "#131B2E", border: `1px solid ${detail.dayDef.color}55` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px]" style={{ color: detail.dayDef.color }}>
                {selectedDate.getMonth() + 1}/{selectedDate.getDate()}（{detail.dayDef.full}）
              </div>
              <div className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{detail.dayDef.title}</div>
            </div>
            <div className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{detail.done}/{detail.total}</div>
          </div>
          {selectedIsCurrentWeek ? (
            <button
              onClick={() => onEditToday(DAYS.findIndex((d) => d.key === detail.dayDef.key))}
              className="w-full mt-3 rounded-lg py-2 text-xs font-bold"
              style={{ background: detail.dayDef.color, color: "#0B1120" }}
            >
              この日を開いて記録する
            </button>
          ) : (
            <div className="text-[11px] mt-2" style={{ color: "#64748B" }}>記録の編集は今週分のみ「日ごと」から行えます</div>
          )}
        </div>
      )}
    </div>
  );
}

function YearCalendar({ calendarYear, setCalendarYear, weekCache, ensureWeeksLoaded, onJumpToMonth }) {
  useEffect(() => {
    ensureWeeksLoaded(weekKeysForYear(calendarYear));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarYear]);

  return (
    <div className="px-5 mt-4 pb-8">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCalendarYear((y) => y - 1)} className="rounded-lg p-1.5" style={{ background: "#131B2E" }}>
          <ChevronLeft size={16} color="#CBD5E1" />
        </button>
        <span className="text-sm font-bold" style={{ color: "#F1F5F9" }}>{calendarYear}年</span>
        <button onClick={() => setCalendarYear((y) => y + 1)} className="rounded-lg p-1.5" style={{ background: "#131B2E" }}>
          <ChevronRight size={16} color="#CBD5E1" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth key={m} year={calendarYear} month={m} weekCache={weekCache} onClick={() => onJumpToMonth(new Date(calendarYear, m, 1))} />
        ))}
      </div>
    </div>
  );
}

function MiniMonth({ year, month, weekCache, onClick }) {
  const dates = useMemo(() => monthGridDates(new Date(year, month, 1)), [year, month]);
  return (
    <button onClick={onClick} className="rounded-xl p-2" style={{ background: "#131B2E", border: "1px solid #1E293B" }}>
      <div className="text-[10px] font-semibold mb-1 text-left" style={{ color: "#94A3B8" }}>{month + 1}月</div>
      <div className="grid grid-cols-7 gap-[2px]">
        {dates.map((date, i) => {
          const inMonth = date.getMonth() === month;
          const { pct, dayDef } = completionForDate(date, weekCache);
          const full = pct >= 1;
          return (
            <div
              key={i}
              style={{
                width: "100%", aspectRatio: "1/1", borderRadius: 2,
                background: !inMonth ? "transparent" : full ? dayDef.color : pct > 0 ? `${dayDef.color}55` : "#0B1120",
                border: inMonth && pct === 0 ? "1px solid #1E293B" : "none",
              }}
            />
          );
        })}
      </div>
    </button>
  );
}

function GoalChip({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl px-2.5 py-2" style={{ background: "#131B2E", border: "1px solid #1E293B" }}>
      <div className="flex items-center gap-1">
        <Icon size={12} color={color} />
        <span className="text-[10px]" style={{ color: "#94A3B8" }}>{label}</span>
      </div>
      <div className="text-[11px] font-bold mt-0.5 leading-tight" style={{ color: "#F1F5F9" }}>{value}</div>
    </div>
  );
}

function InfoBlock({ title, items, color }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: "#131B2E", border: "1px solid #1E293B" }}>
      <div className="text-xs font-bold mb-2" style={{ color }}>{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it, i) => (
          <span key={i} className="text-[11px] rounded-full px-2.5 py-1" style={{ background: "#0B1120", color: "#CBD5E1", border: "1px solid #1E293B" }}>
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function FormCheckBlock({ name, color }) {
  const form = FORM_CHECK[name];
  if (!form) return null;
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}55` }}>
      <div className="px-3 py-2" style={{ background: `${color}1A` }}>
        <div className="text-[10px] font-bold" style={{ color }}>↕ 動作のキュー</div>
        <div className="text-xs font-bold mt-0.5" style={{ color: "#F1F5F9" }}>{form.cue}</div>
      </div>
      <div className="p-3 space-y-2.5" style={{ background: "#0B1120" }}>
        <div>
          <div className="text-[10px] font-bold mb-1.5" style={{ color: "#94A3B8" }}>🎯 鍛える部位</div>
          <div className="flex flex-wrap gap-1.5">
            {form.target.map((t) => (
              <span key={t} className="text-[10px] font-semibold rounded-full px-2 py-1" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold mb-1.5" style={{ color: "#4ADE80" }}>✓ 正しいフォーム</div>
          <div className="space-y-1">
            {form.points.map((p, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                <span className="font-bold flex-shrink-0" style={{ color: "#4ADE80" }}>{i + 1}</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold mb-1.5" style={{ color: "#F87171" }}>⚠ NGフォーム</div>
          <div className="space-y-1">
            {form.ng.map((n, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed" style={{ color: "#CBD5E1" }}>
                <span className="font-bold flex-shrink-0" style={{ color: "#F87171" }}>×</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AltExerciseChip({ alt, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "#0B1120", border: `1px dashed ${color}66` }}>
      <button className="w-full text-left flex items-center justify-between gap-2" onClick={() => setOpen((o) => !o)}>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <RefreshCw size={11} color={color} style={{ flexShrink: 0 }} />
            <span className="text-[10px] font-semibold" style={{ color }}>代替：{alt.name}</span>
            <ChevronDown size={11} color="#64748B" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: "#94A3B8" }}>{alt.detail}</div>
        </div>
      </button>
      {open && (
        <p className="text-[11px] leading-relaxed mt-2 pt-2" style={{ color: "#CBD5E1", borderTop: "1px solid #1E293B" }}>
          {alt.howto}
        </p>
      )}
    </div>
  );
}

function IndoorAltBlock({ items, color }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };
  return (
    <div className="rounded-2xl px-4 py-3" style={{ background: "#131B2E", border: `1px solid ${color}55` }}>
      <div className="text-xs font-bold mb-2" style={{ color }}>🏠 屋内代替（ダンベル・ベンチ以外の道具なしでOK）</div>
      <div className="space-y-2">
        {items.map((it, i) => {
          const isOpen = open.has(i);
          return (
            <div key={i} className="rounded-xl px-3 py-2" style={{ background: "#0B1120", border: "1px solid #1E293B" }}>
              <button className="w-full text-left flex items-center justify-between gap-2" onClick={() => toggle(i)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: "#F1F5F9" }}>{it.name}</span>
                    <ChevronDown size={12} color="#64748B" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "#94A3B8" }}>{it.detail}</div>
                </div>
              </button>
              {isOpen && (
                <p className="text-[11px] leading-relaxed mt-2 pt-2" style={{ color: "#CBD5E1", borderTop: "1px solid #1E293B" }}>
                  {it.howto}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
