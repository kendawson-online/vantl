// Minimal mock for swiper used in tests
export default function SwiperMock() {
  this.activeIndex = 0;
}
SwiperMock.prototype.slideTo = function() {};
SwiperMock.prototype.update = function() {};
SwiperMock.prototype.destroy = function() {};
export const Swiper = SwiperMock;
