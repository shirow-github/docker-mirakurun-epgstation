FROM node:12-buster-slim
EXPOSE 40772 9229
ENV DOCKER="YES"
ENV DEV="libpcsclite-dev build-essential curl libssl-dev yasm libtool autoconf pkg-config gcc git g++ make automake"

RUN apt-get update && \
    apt-get -y install pcscd libpcsclite1 libccid pcsc-tools && \
    apt-get -y install $DEV && \
\
# libpcsclite-bcas
\
    git clone https://github.com/shirow-github/libpcsclite-bcas.git /tmp/libpcsclite-bcas && \
    cd /tmp/libpcsclite-bcas && \
    ./bootstrap && \
    ./configure && \
    make && \
    make install && \
    /sbin/ldconfig && \
\
# libarib25
\
    git clone https://github.com/shirow-github/libarib25.git /tmp/libarib25 && \
    cd /tmp/libarib25 && \
    ./bootstrap && \
    ./configure pcsclite_CFLAGS="-I/usr/local/include/libpcsclite-bcas -I/usr/include/PCSC -pthread" pcsclite_LIBS="-L/usr/lib -lpcsclitebcas" && \
    make && \
    make install && \
    /sbin/ldconfig && \
\
# recpt1
\
    git clone https://github.com/shirow-github/recpt1.git /tmp/recpt1 && \
    cd /tmp/recpt1/recpt1 && \
    ./autogen.sh && \
    ./configure --enable-softcas && \
    make && \
    make install && \
\
# pm2
\
    npm install pm2 -g && \
\
# mirakurun
    npm install mirakurun -g --unsafe-perm --production && \
\
# 不要なパッケージを削除
\
    apt-get -y remove $DEV && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/libpcsclite-bcas && \
    rm -rf /tmp/libarib25 && \
    rm -rf /tmp/recpt1

WORKDIR /usr/local/lib/node_modules/mirakurun

ENTRYPOINT /etc/init.d/pcscd start && \
    npm start
