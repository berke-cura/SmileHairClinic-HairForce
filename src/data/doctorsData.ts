// src/data/doctorsData.ts

export interface DoctorData {
  id: string;
  nameKey: string;
  titleKey: string;
  imageUrl: string;
  bioKey: string; // Paragraf dizisinin anahtarı
  interviewKey: string; // Soru-Cevap dizisinin anahtarı
}

export const doctorsData: DoctorData[] = [
  {
    id: 'gokay-bilgin',
    nameKey: 'doctors.bilgin.name',
    titleKey: 'doctors.bilgin.title',
    imageUrl: 'https://images.ctfassets.net/kfkw517g6gvn/41EF8LgWsK8qOqjj9yqdDU/f09e14aded74fd3faafe842447da77dc/DR._G_KAY_B_LG_N_-_SLIDER.jpg?fit=fill&w=890&h=890',
    bioKey: 'doctors.bilgin.bio',
    interviewKey: 'doctors.bilgin.interview',
  },
  {
    id: 'mehmet-erdogan',
    nameKey: 'doctors.erdogan.name',
    titleKey: 'doctors.erdogan.title',
    imageUrl: 'https://images.ctfassets.net/kfkw517g6gvn/6BpDgQKlKiyrM6o7afRvgA/cc5e9e3f80a53207a43bc175308924b6/DR._MEHMET_ERDOGAN_-_SLIDER.jpg?fit=fill&w=890&h=890',
    bioKey: 'doctors.erdogan.bio',
    interviewKey: 'doctors.erdogan.interview',
  },
];

