FROM chinachu/mirakurun:latest
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
# libaribb25
\
    git clone https://github.com/shirow-github/libaribb25.git /tmp/libaribb25 && \
    cd /tmp/libaribb25 && \
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
# Removing Unnecessary Packages
\
    apt-get -y remove $DEV && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    rm -rf /tmp/libpcsclite-bcas && \
    rm -rf /tmp/libaribb25 && \
    rm -rf /tmp/recpt1
