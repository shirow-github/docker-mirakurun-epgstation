FROM l3tnun/epgstation:latest

ENV DEV="make gcc git g++ automake curl wget autoconf build-essential libass-dev libfreetype6-dev libsdl1.2-dev libtheora-dev libtool libva-dev libvdpau-dev libvorbis-dev libxcb1-dev libxcb-shm0-dev libxcb-xfixes0-dev pkg-config texinfo zlib1g-dev libfdk-aac-dev"
ENV FFMPEG_VERSION="5.0.1"

RUN sed -i.orig -r 's/^(deb.*main)$/\1 non-free contrib/g' /etc/apt/sources.list && \
    apt-get update && \
    apt-get -y install $DEV && \
    apt-get -y install yasm libx264-dev libmp3lame-dev libopus-dev libvpx-dev && \
    apt-get -y install libx265-dev libnuma-dev libfdk-aac1 && \
    apt-get -y install libasound2 libass9 libvdpau1 libva-x11-2 libva-drm2 libxcb-shm0 libxcb-xfixes0 libxcb-shape0 libvorbisenc2 libtheora0 libaribb24-dev && \
    apt-get -y install vainfo i965-va-driver intel-media-va-driver && \
\
# ffmpeg download
    mkdir /tmp/ffmpeg_sources && \
    cd /tmp/ffmpeg_sources && \
    curl -fsSL http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.bz2 | tar -xj --strip-components=1 && \
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
      --enable-libfdk-aac \
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
