class MenuService {
  constructor() {
    this.menu = {
      Senin:  ["Nasi Goreng Ayam","Nasi Tim Ayam","Nasi Capcay Kuah","Nasi Telur Dadar","Nasi Ayam Penyet"],
      Selasa: ["Zuppa Soup","Nasi Soto Betawi","Nasi Rendang","Nasi Ayam Katsu","Nasi Sapi Brokoli"],
      Rabu:   ["Nasi Sop Ayam","Nasi Rawon","Gado-Gado","Nasi Liwet","Nasi Tempe Orak Arik"],
      Kamis:  ["Sayur Asem","Nasi Timlo","Nasi Rames","Gudeg Jogja","Sate Ayam"],
      Jumat:  ["Roti Bakar Srikaya","Nasi Goreng Ikan Asin","Siomay Ikan","Bakso Kuah","Mie Ayam Jamur"],
      Sabtu:  ["Nasi Udang Cabe Garam","Nasi Ayam Bakar","Kailan Cah Bawang Putih","Kwietiau Goreng Ayam","Kwietiau Siram Ayam"],
    };
  }

  getMenu() {
    return this.menu;
  }
}

export default new MenuService();
