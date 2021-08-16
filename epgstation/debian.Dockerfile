FROM l3tnun/epgstation:latest

ENV DEV="make gcc git g++ automake curl wget autoconf build-essential libass-dev libfreetype6-dev libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev libxcb1-dev libxcb-shm0-dev libxcb-xfixes0-dev pkg-config texinfo zlib1g-dev"
ENV FFMPEG_VERSION="4.2.4"

RUN apt-get update && \
    apt-get -y install $DEV && \
    apt-get -y install yasm libx264-dev libmp3lame-dev libopus-dev libvpx-dev && \
    apt-get -y install libx265-dev libnuma-dev && \
    apt-get -y install libasound2 libass9 libvdpau1 libva-x11-2 libva-drm2 libxcb-shm0 libxcb-xfixes0 libxcb-shape0 libvorbisenc2 libtheora0 libaribb24-dev && \
    apt-get -y install vainfo i965-va-driver intel-media-va-driver && \
\
    if [ "${FFMPEG_VERSION}" = "4.2.4" ]; then \
        GIST_URL="10d8a6eab20f4e20c236c01101ee3f35/raw/9cf2d6215696f194bb3385ce7c69635921c138a8"; \
    fi && \
    if [ "${FFMPEG_VERSION}" = "4.1.6" ]; then \
        GIST_URL="df60e627c4dcd5d62273778e04fe5ce7/raw/46954fec0e9381834d88654422404eeb956466f4"; \
    fi && \
\
# ffmpeg download
    mkdir /tmp/ffmpeg_sources && \
    cd /tmp/ffmpeg_sources && \
    curl -fsSL http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.bz2 | tar -xj --strip-components=1 && \
    \
# ffmpeg mpeg2 Paches download
    wget https://gist.githubusercontent.com/shirow-github/${GIST_URL}/ffmpeg-${FFMPEG_VERSION}-mpeg2.patch && \
    patch -p0 < ffmpeg-${FFMPEG_VERSION}-mpeg2.patch && \
    \
# ffmpeg build
    ./configure \
      --prefix=/usr/local \
      --disable-shared \
      --pkg-config-flags=--static \
      --enable-gpl \
      --enable-libass \
      --enable-libfreetype \
      --enable-libmp3lame \
      --enable-libopus \
      --enable-libtheora \
      --enable-libvorbis \
      --enable-libvpx \
      --enable-libx264 \
      --enable-libx265 \
      --enable-version3 \
      --enable-libaribb24 \
      --enable-nonfree \
      --enable-vaapi \
      --disable-debug \
      --disable-doc \
    && \
    make -j$(nproc) && \
    make install && \
\
# Removing Unnecessary Packages
    apt-get -y remove $DEV && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/*
